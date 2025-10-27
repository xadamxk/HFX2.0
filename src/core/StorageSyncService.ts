import { StorageService } from "./StorageService";
import { Logger } from "./Logger";
import { Util } from "./Util";

type StorageChangeEventAreaName = "sync" | "local" | "managed" | "session";

// Constants for storage areas and sync operations
const STORAGE_AREAS = {
  SYNC: "sync",
  LOCAL: "local",
  MANAGED: "managed",
  SESSION: "session",
} as const;

const SYNC_IGNORE_KEY = "_syncIgnore";

const DEFAULT_CONFIG = {
  SYNC_DELAY: 2000, // 2 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 200, // ms
  MIN_DELAY: 100, // minimum delay in ms
} as const;

/**
 * StorageSyncService
 *
 * Handles synchronization between local and sync storage.
 */
export class StorageSyncService {
  private timeout: NodeJS.Timeout | undefined;
  private queuedChanges: { [key: string]: any } = {};
  private syncDelay = DEFAULT_CONFIG.SYNC_DELAY;
  private maxRetries = DEFAULT_CONFIG.MAX_RETRIES;
  private retryDelay = DEFAULT_CONFIG.RETRY_DELAY;

  constructor(private storage: StorageService) {}

  start(): void {
    if (Util.isServiceWorker) {
      this.initializeLocal(() => this.keepSynced());
    }
  }

  private async initializeLocal(callback: Function): Promise<void> {
    try {
      await this.storage.syncFromSyncToLocal();
      callback();
    } catch (error) {
      Logger.error("Failed to initialize local storage from sync:", error);
      callback();
    }
  }

  private keepSynced(): void {
    if (chrome.storage.onChanged.hasListeners()) {
      Logger.warn(
        "Potentially starting the StorageSyncService in multiple locations."
      );
      return;
    }

    chrome.storage.onChanged.addListener(
      (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: StorageChangeEventAreaName
      ) => {
        if (
          changes[SYNC_IGNORE_KEY] &&
          changes[SYNC_IGNORE_KEY].newValue.area === areaName
        ) {
          return;
        }

        if (areaName === STORAGE_AREAS.LOCAL) {
          this.handleLocalChanges(changes);
        } else {
          this.handleSyncChanges(changes);
        }
      }
    );
  }

  private handleLocalChanges(changes: {
    [key: string]: chrome.storage.StorageChange;
  }): void {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
    }

    for (const key in changes) {
      this.queuedChanges[key] = changes[key];
    }

    this.timeout = setTimeout(() => {
      this.commitChanges(STORAGE_AREAS.SYNC, this.queuedChanges);
      this.queuedChanges = {};
      this.timeout = undefined;
    }, this.syncDelay);
  }

  private handleSyncChanges(changes: {
    [key: string]: chrome.storage.StorageChange;
  }): void {
    this.commitChanges(STORAGE_AREAS.LOCAL, changes);
  }

  private async commitChanges(
    areaName: StorageChangeEventAreaName,
    changes: { [key: string]: chrome.storage.StorageChange }
  ): Promise<void> {
    Logger.debug(`Committing changes to ${areaName}.`);

    // Filter out sync ignore keys and build items object
    const items: { [key: string]: any } = {};
    for (const key in changes) {
      if (key !== SYNC_IGNORE_KEY) {
        items[key] = changes[key].newValue;
      }
    }

    // Only proceed if there are actual changes to sync
    if (Object.keys(items).length === 0) {
      return;
    }

    // Add sync ignore marker to prevent infinite loops
    items[SYNC_IGNORE_KEY] = { area: areaName, rand: Math.random() };

    await this.commitWithRetry(areaName, items, 0);
  }

  private async commitWithRetry(
    areaName: StorageChangeEventAreaName,
    items: { [key: string]: any },
    attempt: number
  ): Promise<void> {
    try {
      if (areaName === STORAGE_AREAS.SYNC) {
        // We're committing local changes TO sync storage
        // Set the items directly in sync storage with the ignore marker
        await this.storage.getSyncStorage().setAll(items);
      } else {
        // We're committing sync changes TO local storage
        // Set the items directly in local storage with the ignore marker
        await this.storage.getLocalStorage().setAll(items);
      }

      Logger.debug(
        `Successfully committed changes to ${areaName} on attempt ${
          attempt + 1
        }`
      );
    } catch (error) {
      Logger.error(
        `Failed to commit changes to ${areaName} on attempt ${attempt + 1}:`,
        error
      );

      if (attempt < this.maxRetries - 1) {
        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        Logger.debug(
          `Retrying commit to ${areaName} in ${delay}ms (attempt ${
            attempt + 2
          }/${this.maxRetries})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.commitWithRetry(areaName, items, attempt + 1);
      } else {
        Logger.error(
          `Failed to commit changes to ${areaName} after ${this.maxRetries} attempts. Giving up.`
        );
        // Could implement a dead letter queue or notification system here
      }
    }
  }
}
