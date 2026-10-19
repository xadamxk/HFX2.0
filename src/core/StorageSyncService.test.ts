import { StorageSyncService } from "./StorageSyncService";
import { StorageService } from "./StorageService";
import { MemoryStorage } from "../test-utils/MemoryStorage";

type Listener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void;

describe("StorageSyncService", () => {
  let local: MemoryStorage;
  let sync: MemoryStorage;
  let service: StorageSyncService;
  let listener: Listener;

  beforeEach(() => {
    jest.useFakeTimers();
    (chrome.storage as any).onChanged = { addListener: jest.fn() };
    local = new MemoryStorage();
    sync = new MemoryStorage();
    service = new StorageSyncService(new StorageService(local, sync));
    service.listen();
    const calls = (chrome.storage.onChanged.addListener as jest.Mock).mock
      .calls;
    listener = calls[calls.length - 1][0];
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (chrome.storage as any).onChanged;
    jest.clearAllMocks();
  });

  /** Run the debounce timer and any retries, then let commits settle. */
  const flush = () => jest.advanceTimersByTimeAsync(10_000);

  it("registers the onChanged listener when listen() is called", () => {
    expect(chrome.storage.onChanged.addListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it("pushes local settings changes to sync without storage items", async () => {
    listener(
      {
        HFXBadges: {
          newValue: { enabled: false, storage_badgeMap: { big: "data" } },
        },
      },
      "local"
    );
    await flush();

    expect(sync.items.HFXBadges).toEqual({ enabled: false });
    expect(sync.items._syncIgnore).toBeDefined();
  });

  it("keeps cached data and internal keys local-only", async () => {
    listener(
      {
        "HFXBadges:storage": { newValue: { storage_badgeMap: {} } },
        ges_selector_manager_errors: { newValue: [{ selector: "a" }] },
      },
      "local"
    );
    await flush();

    expect(sync.items).toEqual({});
  });

  it("debounces bursts of local changes into one sync write", async () => {
    const setAll = jest.spyOn(sync, "setAll");

    listener({ A: { newValue: { enabled: true } } }, "local");
    listener({ B: { newValue: { enabled: false } } }, "local");
    await flush();

    expect(setAll).toHaveBeenCalledTimes(1);
    expect(sync.items).toMatchObject({
      A: { enabled: true },
      B: { enabled: false },
    });
  });

  it("removes deleted keys instead of writing undefined", async () => {
    sync.items = { A: { enabled: true }, B: { enabled: true } };
    local.items = { A: { enabled: true } };

    listener({ B: { oldValue: { enabled: true } } }, "local");
    await flush();

    expect("B" in sync.items).toBe(false);
    expect(sync.items.A).toEqual({ enabled: true });

    listener({ A: { oldValue: { enabled: true } } }, "sync");
    await flush();

    expect("A" in local.items).toBe(false);
  });

  it("applies sync changes made by other devices", async () => {
    listener(
      {
        A: { newValue: { enabled: false } },
        _syncIgnore: { newValue: { origin: "another-device", rand: 1 } },
      },
      "sync"
    );
    await flush();

    expect(local.items.A).toEqual({ enabled: false });
  });

  it("ignores the echo of its own commits", async () => {
    listener({ A: { newValue: { enabled: false } } }, "local");
    await flush();
    const marker = sync.items._syncIgnore;

    listener(
      {
        A: { newValue: { enabled: false } },
        _syncIgnore: { newValue: marker },
      },
      "sync"
    );
    await flush();

    expect(local.items).toEqual({});
  });

  it("does not throw when the ignore marker is removed", async () => {
    expect(() =>
      listener({ _syncIgnore: { oldValue: { origin: "x" } } }, "sync")
    ).not.toThrow();
    expect(() =>
      listener(
        {
          _syncIgnore: { oldValue: { origin: "x" } },
          A: { newValue: { enabled: true } },
        },
        "sync"
      )
    ).not.toThrow();
    await flush();

    expect(local.items.A).toEqual({ enabled: true });
  });

  it.each(["session", "managed"])("ignores changes in the %s area", async (area) => {
    listener({ A: { newValue: { enabled: true } } }, area);
    await flush();

    expect(local.items).toEqual({});
    expect(sync.items).toEqual({});
  });

  it("surfaces quota errors without retrying", async () => {
    const setAll = jest
      .spyOn(sync, "setAll")
      .mockRejectedValue(new Error("QUOTA_BYTES quota exceeded"));

    listener({ A: { newValue: { enabled: true } } }, "local");
    await flush();

    expect(setAll).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to sync changes to sync"),
      expect.objectContaining({ message: "QUOTA_BYTES quota exceeded" })
    );
  });

  it("retries transient errors", async () => {
    const setAll = jest
      .spyOn(sync, "setAll")
      .mockRejectedValueOnce(new Error("Temporary failure"));

    listener({ A: { newValue: { enabled: true } } }, "local");
    await flush();

    expect(setAll).toHaveBeenCalledTimes(2);
    expect(sync.items.A).toEqual({ enabled: true });
  });

  it("skips items larger than the sync per-item quota", async () => {
    listener(
      {
        Big: { newValue: { enabled: true, text: "x".repeat(9000) } },
        Small: { newValue: { enabled: true } },
      },
      "local"
    );
    await flush();

    expect("Big" in sync.items).toBe(false);
    expect(sync.items.Small).toEqual({ enabled: true });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Not syncing "Big"')
    );
  });

  describe("reconcile", () => {
    it("keeps local settings, pulls sync-only keys and drops cached data from sync", async () => {
      local.items = {
        A: { enabled: false, storage_cache: "local" },
        "A:storage": { storage_cache: "local" },
      };
      sync.items = {
        A: { enabled: true, storage_cache: "stale" },
        B: { enabled: true, storage_cache: "stale" },
        ges_selector_manager_errors: [],
      };

      await service.reconcile();

      expect(sync.items).toMatchObject({
        A: { enabled: false },
        B: { enabled: true },
      });
      expect(sync.items.A).not.toHaveProperty("storage_cache");
      expect("ges_selector_manager_errors" in sync.items).toBe(false);
      expect("A:storage" in sync.items).toBe(false);
      expect(local.items.B).toEqual({ enabled: true });
      expect(local.items["A:storage"]).toEqual({ storage_cache: "local" });
    });
  });
});
