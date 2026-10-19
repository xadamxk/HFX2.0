import { StorageAdapter, isQuotaError } from "./StorageAdapter";

/**
 * Fake chrome.storage.StorageArea whose callbacks run with
 * chrome.runtime.lastError set to `error` (when given), like Chrome does.
 */
function createStorageArea(error?: string, result: any = {}) {
  const respond = (callback?: (value?: any) => void) => {
    (chrome.runtime as any).lastError = error ? { message: error } : undefined;
    callback?.(result);
    (chrome.runtime as any).lastError = undefined;
  };
  return {
    get: jest.fn((_keys: any, callback: any) => respond(callback)),
    set: jest.fn((_items: any, callback: any) => respond(callback)),
    remove: jest.fn((_keys: any, callback: any) => respond(callback)),
    clear: jest.fn((callback: any) => respond(callback)),
  } as unknown as chrome.storage.StorageArea;
}

describe("StorageAdapter", () => {
  it("resolves values when there is no lastError", async () => {
    const adapter = new StorageAdapter(createStorageArea(undefined, { a: 1 }));

    await expect(adapter.get("a")).resolves.toBe(1);
    await expect(adapter.getAll()).resolves.toEqual({ a: 1 });
    await expect(adapter.set("a", 2)).resolves.toBeUndefined();
  });

  it.each([
    ["get", (adapter: StorageAdapter) => adapter.get("a")],
    ["getAll", (adapter: StorageAdapter) => adapter.getAll()],
    ["set", (adapter: StorageAdapter) => adapter.set("a", 1)],
    ["setAll", (adapter: StorageAdapter) => adapter.setAll({ a: 1 })],
    ["remove", (adapter: StorageAdapter) => adapter.remove(["a", "b"])],
    ["clear", (adapter: StorageAdapter) => adapter.clear()],
  ])("%s rejects with chrome.runtime.lastError", async (_name, operation) => {
    const adapter = new StorageAdapter(createStorageArea("Something broke"));

    await expect(operation(adapter)).rejects.toThrow("Something broke");
  });

  it("rejects quota errors so callers can detect them", async () => {
    const adapter = new StorageAdapter(
      createStorageArea("QUOTA_BYTES_PER_ITEM quota exceeded")
    );

    const error = await adapter.set("big", "x").catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(isQuotaError(error)).toBe(true);
  });

  it("rejects when the storage call throws synchronously", async () => {
    const area = createStorageArea();
    (area.set as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid value");
    });

    await expect(new StorageAdapter(area).set("a", 1)).rejects.toThrow(
      "Invalid value"
    );
  });
});

describe("isQuotaError", () => {
  it.each([
    "QUOTA_BYTES quota exceeded",
    "QUOTA_BYTES_PER_ITEM quota exceeded",
    "MAX_ITEMS quota exceeded",
    "MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded",
  ])("treats %p as a quota error", (message) => {
    expect(isQuotaError(new Error(message))).toBe(true);
  });

  it("does not treat other errors as quota errors", () => {
    expect(isQuotaError(new Error("Extension context invalidated."))).toBe(
      false
    );
  });
});
