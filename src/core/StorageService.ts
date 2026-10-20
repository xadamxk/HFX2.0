import { StorageInterface, StorageAdapter } from "./StorageAdapter";

/**
 * Pending read-modify-write operations per key. Shared by every
 * StorageService in this JS context so concurrent updates to the same key
 * (e.g. two setStorageItem calls that aren't awaited) apply in order.
 */
const pendingUpdates: Map<string, Promise<unknown>> = new Map();

let sharedInstance: StorageService | undefined;

/**
 * StorageService
 *
 * Primary storage operations for local and sync storage.
 * Allows direct access to storage adapters for sync services.
 *
 * Use `StorageService.getInstance()` so each JS context (content script,
 * options page) has one cache, kept current by a single onChanged listener.
 */
export class StorageService {
  private localStorage: StorageInterface;
  private syncStorage: StorageInterface;
  private cache: Map<string, any> = new Map();
  private cacheEnabled: boolean = true;
  /**
   * Bumped whenever a key changes (and `epoch` on clear), so a read or write
   * that finishes after a newer change doesn't cache its now-stale value.
   */
  private versions: Map<string, number> = new Map();
  private epoch: number = 0;

  /** The StorageService shared by everything in this JS context. */
  static getInstance(): StorageService {
    if (!sharedInstance) {
      sharedInstance = new StorageService();
    }
    return sharedInstance;
  }

  constructor(localStorage?: StorageInterface, syncStorage?: StorageInterface) {
    this.localStorage =
      localStorage || new StorageAdapter(chrome.storage.local);
    this.syncStorage = syncStorage || new StorageAdapter(chrome.storage.sync);

    // Other contexts (popup, other tabs, the sync service) write to local
    // storage too; keep cached copies of anything they change current.
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(this.handleChanged);
    }
  }

  // Primary storage operations (use local with optional sync)
  async get(key: string): Promise<any> {
    // Check cache first
    if (this.cacheEnabled && this.cache.has(key)) {
      return this.cache.get(key);
    }

    const version = this.versionOf(key);
    const value = await this.localStorage.get(key);

    // Cache the result, unless the key changed while it was being read
    if (this.cacheEnabled && this.versionOf(key) === version) {
      this.cache.set(key, value);
    }

    return value;
  }

  /**
   * Read several keys in a single storage call, always from storage. Missing
   * keys are cached as undefined, matching get().
   */
  async getMany(keys: string[]): Promise<{ [key: string]: any }> {
    const versions = keys.map((key) => this.versionOf(key));
    const values = await this.localStorage.getMany(keys);

    if (this.cacheEnabled) {
      keys.forEach((key, i) => {
        if (this.versionOf(key) === versions[i]) {
          this.cache.set(key, values[key]);
        }
      });
    }

    return values;
  }

  async set(key: string, value: any): Promise<void> {
    const version = this.versionOf(key);
    await this.localStorage.set(key, value);
    this.recordWrite(key, value, version);

    // Note: Sync is handled by StorageSyncService via change listeners
    // No need for immediate sync here to avoid double writes
  }

  /**
   * Read-modify-write a single key. Always reads the latest stored value
   * (never the cache) and serializes with other updates to the same key in
   * this context, so callers only overwrite the fields they change.
   * Returning `current` unchanged from the updater skips the write.
   * Returns the resulting value.
   */
  async update<T = any>(
    key: string,
    updater: (current: T | undefined) => T
  ): Promise<T> {
    return await this.serialize([key], async () => {
      const current = await this.localStorage.get(key);
      const value = updater(current);
      if (value === current) {
        return value;
      }
      const version = this.versionOf(key);
      await this.localStorage.set(key, value);
      this.recordWrite(key, value, version);
      return value;
    });
  }

  /**
   * Read-modify-write several keys with one read and at most one write.
   * The updater receives the latest stored values of `keys` (missing keys are
   * absent) and returns only the keys to write; returning an empty object
   * skips the write. Serialized with update() on the same keys.
   * Returns the stored values with the changes applied.
   */
  async updateMany(
    keys: string[],
    updater: (current: { [key: string]: any }) => { [key: string]: any }
  ): Promise<{ [key: string]: any }> {
    return await this.serialize(keys, async () => {
      // getMany always reads storage, and caches what it read
      const current = await this.getMany(keys);
      const changes = updater(current);
      const changedKeys = Object.keys(changes);
      if (changedKeys.length === 0) {
        return current;
      }
      const versions = changedKeys.map((key) => this.versionOf(key));
      await this.localStorage.setAll(changes);
      changedKeys.forEach((key, i) =>
        this.recordWrite(key, changes[key], versions[i])
      );
      return { ...current, ...changes };
    });
  }

  async remove(key: string): Promise<void> {
    await this.localStorage.remove(key);
    this.cache.delete(key);
    this.bumpVersion(key);
  }

  async clear(): Promise<void> {
    await this.localStorage.clear();

    // Clear cache
    this.cache.clear();
    this.epoch++;

    // Note: Sync is handled by StorageSyncService via change listeners
  }

  async getAll(): Promise<{ [key: string]: any }> {
    return await this.localStorage.getAll();
  }

  // Direct access to storage adapters for sync operations
  getLocalStorage(): StorageInterface {
    return this.localStorage;
  }

  getSyncStorage(): StorageInterface {
    return this.syncStorage;
  }

  /**
   * Run `operation` after any pending updates to `keys` in this context, and
   * make later updates to those keys wait for it.
   */
  private async serialize<T>(
    keys: string[],
    operation: () => Promise<T>
  ): Promise<T> {
    const previous = Promise.all(
      keys.map((key) =>
        (pendingUpdates.get(key) ?? Promise.resolve()).catch(
          (): void => undefined
        )
      )
    );
    const next = previous.then(operation);

    keys.forEach((key) => pendingUpdates.set(key, next));
    try {
      return await next;
    } finally {
      keys.forEach((key) => {
        if (pendingUpdates.get(key) === next) {
          pendingUpdates.delete(key);
        }
      });
    }
  }

  private versionOf(key: string): string {
    return `${this.epoch}:${this.versions.get(key) ?? 0}`;
  }

  private bumpVersion(key: string): void {
    this.versions.set(key, (this.versions.get(key) ?? 0) + 1);
  }

  /**
   * Cache a value this context just wrote. If another change to the key
   * arrived while writing, drop the entry instead; the next read fetches it.
   */
  private recordWrite(
    key: string,
    value: any,
    versionBeforeWrite: string
  ): void {
    if (this.cacheEnabled && this.versionOf(key) === versionBeforeWrite) {
      this.cache.set(key, value);
    } else {
      this.cache.delete(key);
    }
    this.bumpVersion(key);
  }

  /**
   * onChanged events arrive in commit order and carry the new value, so the
   * cache takes it as is (including echoes of this context's own writes).
   */
  private handleChanged = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ): void => {
    if (areaName !== "local") return;
    for (const key of Object.keys(changes)) {
      if (this.cacheEnabled) {
        this.cache.set(key, changes[key].newValue);
      }
      this.bumpVersion(key);
    }
  };
}
