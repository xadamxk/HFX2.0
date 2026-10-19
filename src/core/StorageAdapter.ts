// Storage abstraction interface
export interface StorageInterface {
  get(key: string): Promise<any>;
  getMany(keys: string[]): Promise<{ [key: string]: any }>;
  set(key: string, value: any): Promise<void>;
  setAll(items: { [key: string]: any }): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
  getAll(): Promise<{ [key: string]: any }>;
}

/**
 * Whether a storage error is a quota/rate-limit error (e.g. QUOTA_BYTES,
 * QUOTA_BYTES_PER_ITEM, MAX_ITEMS, MAX_WRITE_OPERATIONS_PER_MINUTE).
 * Retrying these immediately cannot succeed.
 */
export function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /QUOTA_BYTES|MAX_ITEMS|MAX_WRITE_OPERATIONS/i.test(message);
}

/**
 * StorageAdapter
 *
 * Abstract implementation of the StorageInterface.
 * Provides a wrapper around the Chromium storage API.
 * Every operation rejects when chrome.runtime.lastError is set.
 */
export class StorageAdapter implements StorageInterface {
  constructor(private storageArea: chrome.storage.StorageArea) {}

  async get(key: string): Promise<any> {
    const result = await this.call<{ [key: string]: any }>((callback) =>
      this.storageArea.get(key, callback)
    );
    return result?.[key];
  }

  async getMany(keys: string[]): Promise<{ [key: string]: any }> {
    const result = await this.call<{ [key: string]: any }>((callback) =>
      this.storageArea.get(keys, callback)
    );
    return result ?? {};
  }

  async set(key: string, value: any): Promise<void> {
    await this.call((callback) =>
      this.storageArea.set({ [key]: value }, callback)
    );
  }

  async setAll(items: { [key: string]: any }): Promise<void> {
    await this.call((callback) => this.storageArea.set(items, callback));
  }

  async remove(keys: string | string[]): Promise<void> {
    await this.call((callback) => this.storageArea.remove(keys, callback));
  }

  async clear(): Promise<void> {
    await this.call((callback) => this.storageArea.clear(callback));
  }

  async getAll(): Promise<{ [key: string]: any }> {
    const items = await this.call<{ [key: string]: any }>((callback) =>
      this.storageArea.get(null, callback)
    );
    return items ?? {};
  }

  /**
   * Run a callback-style storage call, rejecting on chrome.runtime.lastError
   * (and on synchronous throws, e.g. for unserializable values).
   */
  private call<T = void>(
    invoke: (callback: (result?: T) => void) => void
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      invoke((result?: T) => {
        const lastError = chrome.runtime?.lastError;
        if (lastError) {
          reject(new Error(lastError.message ?? "Unknown storage error"));
          return;
        }
        resolve(result as T);
      });
    });
  }
}
