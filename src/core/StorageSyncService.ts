import { StorageService } from "./StorageService";
import { isQuotaError } from "./StorageAdapter";
import { Logger } from "./Logger";
import { isLocalOnlyKey, withoutStorageItems } from "./constants";

type StorageChanges = { [key: string]: chrome.storage.StorageChange };

// Constants for storage areas and sync operations
const STORAGE_AREAS = {
  SYNC: "sync",
  LOCAL: "local",
} as const;

type SyncedArea = (typeof STORAGE_AREAS)[keyof typeof STORAGE_AREAS];

/**
 * Written alongside every commit so the resulting onChanged event can be
 * recognized as our own echo. `origin` identifies this service instance, so
 * commits made by other devices are still applied.
 */
const SYNC_IGNORE_KEY = "_syncIgnore";

const DEFAULT_CONFIG = {
  SYNC_DELAY: 2000, // 2 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 200, // ms
} as const;

/** chrome.storage.sync.QUOTA_BYTES_PER_ITEM */
const SYNC_QUOTA_BYTES_PER_ITEM = 8192;

/**
 * Size of an item as chrome.storage.sync counts it: key length plus the
 * UTF-8 length of the JSON-serialized value.
 */
export function getSyncItemSize(key: string, value: any): number {
  return utf8Length(key) + utf8Length(JSON.stringify(value) ?? "");
}

function utf8Length(text: string): number {
  let length = 0;
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;
    length +=
      codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
  }
  return length;
}

/**
 * The value of a key as it should exist in the other storage area: user
 * settings only, never cached data.
 */
function toSyncedValue(value: any): any {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return withoutStorageItems(value);
  }
  return value;
}

/**
 * StorageSyncService
 *
 * Mirrors user settings between chrome.storage.local and chrome.storage.sync.
 * Cached data (`<class>:storage`, `ges_*`) and storage item fields stay local.
 *
 * In an MV3 service worker, `listen()` must be called synchronously at the top
 * level of the worker script so the listener exists every time the worker
 * restarts.
 */
export class StorageSyncService {
  private timeout: ReturnType<typeof setTimeout> | undefined;
  private queuedChanges: StorageChanges = {};
  private syncDelay: number = DEFAULT_CONFIG.SYNC_DELAY;
  private maxRetries: number = DEFAULT_CONFIG.MAX_RETRIES;
  private retryDelay: number = DEFAULT_CONFIG.RETRY_DELAY;
  private readonly origin = `${Date.now()}-${Math.random()}`;

  constructor(private storage: StorageService) {}

  /** Register the chrome.storage.onChanged listener. */
  listen(): void {
    chrome.storage.onChanged.addListener(this.handleChanged);
  }

  /**
   * One-time reconciliation, run on install/update. Local values win for keys
   * present in both areas (sync may be stale); keys only in sync are pulled
   * into local. Cached data found in sync by older versions is removed.
   */
  async reconcile(): Promise<void> {
    const [localItems, syncItems] = await Promise.all([
      this.storage.getLocalStorage().getAll(),
      this.storage.getSyncStorage().getAll(),
    ]);

    const toLocal: { [key: string]: any } = {};
    const toSync: { [key: string]: any } = {};
    const removeFromSync: string[] = [];

    for (const key of Object.keys(syncItems)) {
      if (isLocalOnlyKey(key)) {
        if (key !== SYNC_IGNORE_KEY) removeFromSync.push(key);
      } else if (!(key in localItems)) {
        toLocal[key] = toSyncedValue(syncItems[key]);
      }
    }

    for (const key of Object.keys(localItems)) {
      if (isLocalOnlyKey(key)) continue;
      const value = toSyncedValue(localItems[key]);
      if (JSON.stringify(value) !== JSON.stringify(syncItems[key])) {
        toSync[key] = value;
      }
    }

    if (removeFromSync.length > 0) {
      await this.storage.getSyncStorage().remove(removeFromSync);
    }
    await this.commit(STORAGE_AREAS.LOCAL, toLocal, []);
    await this.commit(STORAGE_AREAS.SYNC, toSync, []);
  }

  private handleChanged = (changes: StorageChanges, areaName: string): void => {
    if (areaName !== STORAGE_AREAS.LOCAL && areaName !== STORAGE_AREAS.SYNC) {
      return;
    }

    if (changes[SYNC_IGNORE_KEY]?.newValue?.origin === this.origin) {
      return;
    }

    const synced: StorageChanges = {};
    for (const key of Object.keys(changes)) {
      if (!isLocalOnlyKey(key)) {
        synced[key] = changes[key];
      }
    }
    if (Object.keys(synced).length === 0) {
      return;
    }

    if (areaName === STORAGE_AREAS.LOCAL) {
      this.queueLocalChanges(synced);
    } else {
      this.applyChanges(STORAGE_AREAS.LOCAL, synced);
    }
  };

  /** Debounce local changes so bursts become a single sync write. */
  private queueLocalChanges(changes: StorageChanges): void {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
    }

    Object.assign(this.queuedChanges, changes);

    this.timeout = setTimeout(() => {
      const queued = this.queuedChanges;
      this.queuedChanges = {};
      this.timeout = undefined;
      this.applyChanges(STORAGE_AREAS.SYNC, queued);
    }, this.syncDelay);
  }

  private applyChanges(target: SyncedArea, changes: StorageChanges): void {
    const items: { [key: string]: any } = {};
    const removed: string[] = [];
    for (const key of Object.keys(changes)) {
      if (changes[key].newValue === undefined) {
        removed.push(key);
      } else {
        items[key] = toSyncedValue(changes[key].newValue);
      }
    }

    this.commit(target, items, removed).catch((error) => {
      Logger.error(`Failed to sync changes to ${target}:`, error);
    });
  }

  /**
   * Write `items` to and remove `removed` from the target area. Rejects with
   * the storage error (e.g. a quota error) once retries are exhausted.
   */
  async commit(
    target: SyncedArea,
    items: { [key: string]: any },
    removed: string[]
  ): Promise<void> {
    const area =
      target === STORAGE_AREAS.SYNC
        ? this.storage.getSyncStorage()
        : this.storage.getLocalStorage();

    const writes: { [key: string]: any } = {};
    for (const key of Object.keys(items)) {
      if (target === STORAGE_AREAS.SYNC) {
        const size = getSyncItemSize(key, items[key]);
        if (size > SYNC_QUOTA_BYTES_PER_ITEM) {
          Logger.error(
            `Not syncing "${key}": ${size} bytes exceeds the ${SYNC_QUOTA_BYTES_PER_ITEM} byte sync item limit.`
          );
          continue;
        }
      }
      writes[key] = items[key];
    }

    if (removed.length > 0) {
      await this.withRetry(target, () => area.remove(removed));
    }

    if (Object.keys(writes).length > 0) {
      // Marks the resulting onChanged event as our own echo
      writes[SYNC_IGNORE_KEY] = { origin: this.origin, rand: Math.random() };
      await this.withRetry(target, () => area.setAll(writes));
      Logger.debug(`Committed ${Object.keys(writes).length - 1} item(s) to ${target}.`);
    }
  }

  private async withRetry(
    target: SyncedArea,
    operation: () => Promise<void>,
    attempt: number = 0
  ): Promise<void> {
    try {
      await operation();
    } catch (error) {
      if (isQuotaError(error) || attempt >= this.maxRetries - 1) {
        throw error;
      }

      const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
      Logger.warn(
        `Commit to ${target} failed (attempt ${attempt + 1}/${
          this.maxRetries
        }), retrying in ${delay}ms:`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.withRetry(target, operation, attempt + 1);
    }
  }
}
