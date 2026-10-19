import { StorageInterface, StorageAdapter } from "./StorageAdapter";

/**
 * Pending read-modify-write operations per key. Shared by every
 * StorageService in this JS context so concurrent updates to the same key
 * (e.g. two setStorageItem calls that aren't awaited) apply in order.
 */
const pendingUpdates: Map<string, Promise<unknown>> = new Map();

/**
 * StorageService
 *
 * Primary storage operations for local and sync storage.
 * Allows direct access to storage adapters for sync services.
 */
export class StorageService {
  private localStorage: StorageInterface;
  private syncStorage: StorageInterface;
  private cache: Map<string, any> = new Map();
  private cacheEnabled: boolean = true;

  constructor(localStorage?: StorageInterface, syncStorage?: StorageInterface) {
    this.localStorage =
      localStorage || new StorageAdapter(chrome.storage.local);
    this.syncStorage = syncStorage || new StorageAdapter(chrome.storage.sync);

    // Other contexts (popup, other tabs, the sync service) write to local
    // storage too; drop cached copies of anything they change.
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(this.invalidateChanged);
    }
  }

  // Primary storage operations (use local with optional sync)
  async get(key: string): Promise<any> {
    // Check cache first
    if (this.cacheEnabled && this.cache.has(key)) {
      return this.cache.get(key);
    }

    const value = await this.localStorage.get(key);

    // Cache the result
    if (this.cacheEnabled) {
      this.cache.set(key, value);
    }

    return value;
  }

  async set(key: string, value: any): Promise<void> {
    await this.localStorage.set(key, value);

    // Update cache
    if (this.cacheEnabled) {
      this.cache.set(key, value);
    }

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
    const previous = pendingUpdates.get(key) ?? Promise.resolve();
    const next = previous
      .catch((): void => undefined)
      .then(async () => {
        const current = await this.localStorage.get(key);
        const value = updater(current);
        if (value === current) {
          return value;
        }
        await this.localStorage.set(key, value);
        if (this.cacheEnabled) {
          this.cache.set(key, value);
        }
        return value;
      });

    pendingUpdates.set(key, next);
    try {
      return await next;
    } finally {
      if (pendingUpdates.get(key) === next) {
        pendingUpdates.delete(key);
      }
    }
  }

  async remove(key: string): Promise<void> {
    await this.localStorage.remove(key);
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    await this.localStorage.clear();

    // Clear cache
    if (this.cacheEnabled) {
      this.cache.clear();
    }

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

  private invalidateChanged = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ): void => {
    if (areaName !== "local") return;
    for (const key of Object.keys(changes)) {
      this.cache.delete(key);
    }
  };
}
