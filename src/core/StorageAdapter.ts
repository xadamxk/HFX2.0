// Storage abstraction interface
export interface StorageInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  setAll(items: { [key: string]: any }): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll(): Promise<{ [key: string]: any }>;
}

/**
 * StorageAdapter
 *
 * Abstract implementation of the StorageInterface.
 * Provides a wrapper around the Chromium storage API.
 */
export class StorageAdapter implements StorageInterface {
  constructor(private storageArea: chrome.storage.StorageArea) {}

  async get(key: string): Promise<any> {
    return new Promise((resolve) => {
      this.storageArea.get(key, (result) => {
        resolve(result[key]);
      });
    });
  }

  async set(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      this.storageArea.set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  async setAll(items: { [key: string]: any }): Promise<void> {
    return new Promise((resolve) => {
      this.storageArea.set(items, () => {
        resolve();
      });
    });
  }

  async remove(key: string): Promise<void> {
    return new Promise((resolve) => {
      this.storageArea.remove(key, () => {
        resolve();
      });
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      this.storageArea.clear(() => {
        resolve();
      });
    });
  }

  async getAll(): Promise<{ [key: string]: any }> {
    return new Promise((resolve) => {
      this.storageArea.get(null, (items) => {
        resolve(items);
      });
    });
  }
}
