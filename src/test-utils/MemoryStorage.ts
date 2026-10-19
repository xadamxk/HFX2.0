import { StorageInterface } from "../core/StorageAdapter";

/**
 * In-memory StorageInterface for tests. Values are deep-copied on the way in
 * and out, like chrome.storage, so callers can't mutate stored state.
 */
export class MemoryStorage implements StorageInterface {
  items: { [key: string]: any } = {};

  constructor(initial: { [key: string]: any } = {}) {
    this.items = copy(initial);
  }

  async get(key: string): Promise<any> {
    return copy(this.items[key]);
  }

  async getMany(keys: string[]): Promise<{ [key: string]: any }> {
    const result: { [key: string]: any } = {};
    for (const key of keys) {
      if (key in this.items) result[key] = copy(this.items[key]);
    }
    return result;
  }

  async set(key: string, value: any): Promise<void> {
    this.items[key] = copy(value);
  }

  async setAll(items: { [key: string]: any }): Promise<void> {
    Object.assign(this.items, copy(items));
  }

  async remove(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      delete this.items[key];
    }
  }

  async clear(): Promise<void> {
    this.items = {};
  }

  async getAll(): Promise<{ [key: string]: any }> {
    return copy(this.items);
  }
}

function copy<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}
