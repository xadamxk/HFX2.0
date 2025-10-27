import { StorageInterface, StorageAdapter } from "./StorageAdapter";
import { Logger } from "./Logger";

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

  // Sync-specific operations
  async syncFromSyncToLocal(): Promise<void> {
    const syncItems = await this.syncStorage.getAll();
    if (Object.keys(syncItems).length > 0) {
      await this.localStorage.setAll(syncItems);
    }
  }

  // Direct access to storage adapters for sync operations
  getLocalStorage(): StorageInterface {
    return this.localStorage;
  }

  getSyncStorage(): StorageInterface {
    return this.syncStorage;
  }
}
