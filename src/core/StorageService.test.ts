import { StorageService } from "./StorageService";
import { MemoryStorage } from "../test-utils/MemoryStorage";

type ChangeListener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void;

/** Resolves once every queued microtask has run. */
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("StorageService", () => {
  let local: MemoryStorage;
  let storage: StorageService;
  let listeners: ChangeListener[];

  /** Simulate chrome.storage.onChanged after another context writes. */
  const changeFromElsewhere = (
    key: string,
    newValue: any,
    areaName = "local"
  ) => {
    if (areaName === "local") {
      if (newValue === undefined) delete local.items[key];
      else local.items[key] = newValue;
    }
    listeners.forEach((listener) => listener({ [key]: { newValue } }, areaName));
  };

  beforeEach(() => {
    listeners = [];
    (chrome.storage as any).onChanged = {
      addListener: jest.fn((listener: ChangeListener) =>
        listeners.push(listener)
      ),
      removeListener: jest.fn(),
    };
    local = new MemoryStorage();
    storage = new StorageService(local, new MemoryStorage());
  });

  afterEach(() => {
    delete (chrome.storage as any).onChanged;
  });

  describe("getInstance", () => {
    it("shares one instance, and one onChanged listener, per context", () => {
      jest.isolateModules(() => {
        // isolateModules needs a synchronous require to get a fresh module
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { StorageService: IsolatedService } = require("./StorageService");
        const addListener = (chrome.storage as any).onChanged.addListener;
        addListener.mockClear();

        const first = IsolatedService.getInstance();
        const second = IsolatedService.getInstance();

        expect(first).toBe(second);
        expect(addListener).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("cache", () => {
    it("serves repeat reads from the cache", async () => {
      local.items = { Feature: { enabled: true } };
      const get = jest.spyOn(local, "get");

      await storage.get("Feature");
      await expect(storage.get("Feature")).resolves.toEqual({ enabled: true });

      expect(get).toHaveBeenCalledTimes(1);
    });

    it("takes new values from onChanged without reading storage", async () => {
      local.items = { Feature: { enabled: true } };
      await storage.get("Feature");
      const get = jest.spyOn(local, "get");

      changeFromElsewhere("Feature", { enabled: false });

      await expect(storage.get("Feature")).resolves.toEqual({ enabled: false });
      expect(get).not.toHaveBeenCalled();
    });

    it("caches removals from onChanged as missing", async () => {
      local.items = { Feature: { enabled: true } };
      await storage.get("Feature");

      changeFromElsewhere("Feature", undefined);

      await expect(storage.get("Feature")).resolves.toBeUndefined();
    });

    it("ignores changes to other storage areas", async () => {
      local.items = { Feature: { enabled: true } };
      await storage.get("Feature");

      changeFromElsewhere("Feature", { enabled: false }, "sync");

      await expect(storage.get("Feature")).resolves.toEqual({ enabled: true });
    });

    it("does not cache a read that finished after a newer change", async () => {
      local.items = { Feature: { enabled: true } };
      let finishRead!: (value: any) => void;
      jest
        .spyOn(local, "get")
        .mockImplementationOnce(
          () => new Promise((resolve) => (finishRead = resolve))
        );

      const read = storage.get("Feature");
      changeFromElsewhere("Feature", { enabled: false });
      finishRead({ enabled: true });
      await read;

      await expect(storage.get("Feature")).resolves.toEqual({ enabled: false });
    });

    it("does not cache its own write when another change landed during it", async () => {
      let finishWrite!: () => void;
      jest
        .spyOn(local, "set")
        .mockImplementationOnce(
          () => new Promise<void>((resolve) => (finishWrite = resolve))
        );

      const write = storage.set("Feature", { enabled: true });
      changeFromElsewhere("Feature", { enabled: false });
      finishWrite();
      await write;

      // The entry was dropped, so the next read goes to storage
      await expect(storage.get("Feature")).resolves.toEqual({ enabled: false });
    });

    it("does not cache a failed write", async () => {
      local.items = { Feature: { enabled: true } };
      await storage.get("Feature");
      jest.spyOn(local, "set").mockRejectedValueOnce(new Error("Write failed"));

      await expect(storage.set("Feature", { enabled: false })).rejects.toThrow(
        "Write failed"
      );
      await expect(storage.get("Feature")).resolves.toEqual({ enabled: true });
    });
  });

  describe("update", () => {
    it("reads the latest stored value rather than the cache", async () => {
      local.items = { Feature: { enabled: true, color: "red" } };
      await storage.get("Feature");
      // Written without an onChanged event reaching this context yet
      local.items.Feature = { enabled: false, color: "red" };

      await storage.update("Feature", (current) => ({
        ...current,
        color: "blue",
      }));

      expect(local.items.Feature).toEqual({ enabled: false, color: "blue" });
    });

    it("rejects with the storage error", async () => {
      jest.spyOn(local, "set").mockRejectedValueOnce(new Error("Write failed"));

      await expect(
        storage.update("Feature", () => ({ enabled: true }))
      ).rejects.toThrow("Write failed");
    });
  });

  describe("updateMany", () => {
    it("reads and writes every key in one call each", async () => {
      local.items = { A: 1, B: 2 };
      const getMany = jest.spyOn(local, "getMany");
      const setAll = jest.spyOn(local, "setAll");

      const result = await storage.updateMany(["A", "B", "C"], (current) => ({
        A: current.A + 10,
        C: 3,
      }));

      expect(getMany).toHaveBeenCalledTimes(1);
      expect(setAll).toHaveBeenCalledTimes(1);
      expect(setAll).toHaveBeenCalledWith({ A: 11, C: 3 });
      expect(result).toEqual({ A: 11, B: 2, C: 3 });
      expect(local.items).toEqual({ A: 11, B: 2, C: 3 });
    });

    it("skips the write when nothing changed", async () => {
      const setAll = jest.spyOn(local, "setAll");

      await storage.updateMany(["A"], () => ({}));

      expect(setAll).not.toHaveBeenCalled();
    });

    it("runs in order with update() calls on the same keys", async () => {
      local.items = { A: { count: 0 } };

      await Promise.all([
        storage.update("A", (current) => ({ count: current.count + 1 })),
        storage.updateMany(["A", "B"], (current) => ({
          A: { count: current.A.count + 1 },
          B: true,
        })),
        storage.update("A", (current) => ({ count: current.count + 1 })),
      ]);
      await flushPromises();

      expect(local.items).toEqual({ A: { count: 3 }, B: true });
    });
  });
});
