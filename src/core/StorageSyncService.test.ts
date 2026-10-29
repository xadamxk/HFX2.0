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

    it("merges User Notes shards per uid instead of letting local win", async () => {
      local.items = { "UserNotes:notes:1": { "1": { n: "local", t: 5 }, "17": { n: "old", t: 1 } } };
      sync.items = {
        "UserNotes:notes:1": { "17": { n: "other device", t: 2 } },
        "UserNotes:notes:2": { "2": { n: "sync only", t: 3 } },
      };

      await service.reconcile();

      const merged = { "1": { n: "local", t: 5 }, "17": { n: "other device", t: 2 } };
      expect(local.items["UserNotes:notes:1"]).toEqual(merged);
      expect(sync.items["UserNotes:notes:1"]).toEqual(merged);
      expect(local.items["UserNotes:notes:2"]).toEqual({ "2": { n: "sync only", t: 3 } });
    });
  });

  describe("User Notes", () => {
    it("merges a local edit into sync without dropping another device's note", async () => {
      local.items = { "UserNotes:notes:1": { "1": { n: "mine", t: 5 } } };
      sync.items = { "UserNotes:notes:1": { "17": { n: "theirs", t: 4 } } };

      listener({ "UserNotes:notes:1": { newValue: local.items["UserNotes:notes:1"] } }, "local");
      await flush();

      const merged = { "1": { n: "mine", t: 5 }, "17": { n: "theirs", t: 4 } };
      expect(sync.items["UserNotes:notes:1"]).toEqual(merged);
      expect(local.items["UserNotes:notes:1"]).toEqual(merged);
    });

    it("merges another device's change into local and pushes back notes sync lacks", async () => {
      local.items = { "UserNotes:notes:1": { "1": { n: "mine", t: 5 } } };
      sync.items = { "UserNotes:notes:1": { "17": { n: "theirs", t: 6 } } };

      listener(
        {
          "UserNotes:notes:1": { newValue: sync.items["UserNotes:notes:1"] },
          _syncIgnore: { newValue: { origin: "another-device", rand: 1 } },
        },
        "sync"
      );
      await flush();

      const merged = { "1": { n: "mine", t: 5 }, "17": { n: "theirs", t: 6 } };
      expect(local.items["UserNotes:notes:1"]).toEqual(merged);
      expect(sync.items["UserNotes:notes:1"]).toEqual(merged);
    });

    it("propagates a deletion as a tombstone", async () => {
      const deletedAt = Date.now();
      local.items = { "UserNotes:notes:1": { "1": { n: "note", t: deletedAt - 10 } } };
      sync.items = { "UserNotes:notes:1": { "1": { d: 1, t: deletedAt } } };

      listener({ "UserNotes:notes:1": { newValue: sync.items["UserNotes:notes:1"] } }, "sync");
      await flush();

      expect(local.items["UserNotes:notes:1"]).toEqual({ "1": { d: 1, t: deletedAt } });
    });

    it("doesn't wipe notes when a shard is removed in one area", async () => {
      local.items = { "UserNotes:notes:1": { "1": { n: "note", t: 5 } } };
      sync.items = {};

      listener({ "UserNotes:notes:1": { oldValue: { "1": { n: "note", t: 5 } } } }, "sync");
      await flush();

      expect(local.items["UserNotes:notes:1"]).toEqual({ "1": { n: "note", t: 5 } });
      expect(sync.items["UserNotes:notes:1"]).toEqual({ "1": { n: "note", t: 5 } });
    });

    it("leaves settings in the same batch on the usual path", async () => {
      local.items = { "UserNotes:notes:1": { "1": { n: "note", t: 5 } } };
      listener(
        {
          A: { newValue: { enabled: true } },
          "UserNotes:notes:1": { newValue: local.items["UserNotes:notes:1"] },
        },
        "local"
      );
      await flush();

      expect(sync.items.A).toEqual({ enabled: true });
      expect(sync.items["UserNotes:notes:1"]).toEqual({ "1": { n: "note", t: 5 } });
    });

    it("writes nothing when both areas already match", async () => {
      const shard = { "1": { n: "note", t: 5 } };
      local.items = { "UserNotes:notes:1": shard };
      sync.items = { "UserNotes:notes:1": shard };
      const localSetAll = jest.spyOn(local, "setAll");
      const syncSetAll = jest.spyOn(sync, "setAll");

      listener({ "UserNotes:notes:1": { newValue: shard } }, "local");
      await flush();

      expect(localSetAll).not.toHaveBeenCalled();
      expect(syncSetAll).not.toHaveBeenCalled();
    });
  });
});
