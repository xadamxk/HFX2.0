import { SettingsService } from "./SettingsService";
import { StorageService } from "./StorageService";
import { Feature } from "./Feature";
import { MemoryStorage } from "../test-utils/MemoryStorage";

const feature = {
  class: "TestFeature",
  enabled: true,
  configurables: [{ id: "color", default: "red" }],
  storageItems: [
    { id: "cache", description: "Cache", defaultValue: { entries: [] } },
    { id: "lastFetch", description: "Last fetch", defaultValue: 0 },
  ],
  logger: { debug: jest.fn() },
} as unknown as Feature;

const plainFeature = {
  class: "PlainFeature",
  enabled: false,
  logger: { debug: jest.fn() },
} as unknown as Feature;

describe("SettingsService", () => {
  let local: MemoryStorage;
  let storage: StorageService;
  let settingsService: SettingsService;

  beforeEach(() => {
    local = new MemoryStorage();
    storage = new StorageService(local, new MemoryStorage());
    settingsService = new SettingsService(storage);
  });

  describe("setStorageItem", () => {
    it("writes only the changed item to the feature's storage key", async () => {
      local.items = {
        TestFeature: { enabled: true, color: "red" },
        "TestFeature:storage": { storage_cache: { entries: [1] }, storage_lastFetch: 5 },
      };

      await settingsService.setStorageItem(feature, "lastFetch", 10);

      expect(local.items["TestFeature:storage"]).toEqual({
        storage_cache: { entries: [1] },
        storage_lastFetch: 10,
      });
      expect(local.items.TestFeature).toEqual({ enabled: true, color: "red" });
    });

    it("merges into the latest stored value rather than a stale cache", async () => {
      local.items = { "TestFeature:storage": { storage_cache: "old" } };
      // Prime this context's cache
      await settingsService.getStorageItem(feature, "cache");

      // Another context writes a different item
      local.items["TestFeature:storage"] = {
        storage_cache: "old",
        storage_lastFetch: 99,
      };

      await settingsService.setStorageItem(feature, "cache", "new");

      expect(local.items["TestFeature:storage"]).toEqual({
        storage_cache: "new",
        storage_lastFetch: 99,
      });
    });

    it("keeps every item when several writes are not awaited", async () => {
      await Promise.all([
        settingsService.setStorageItem(feature, "cache", "a"),
        settingsService.setStorageItem(feature, "lastFetch", 1),
        new SettingsService(storage).setStorageItem(feature, "other", true),
      ]);

      expect(local.items["TestFeature:storage"]).toEqual({
        storage_cache: "a",
        storage_lastFetch: 1,
        storage_other: true,
      });
    });

    it("never touches user settings written by another context", async () => {
      local.items = { TestFeature: { enabled: true, color: "red" } };
      await settingsService.initializeFeatureSettings([feature]);

      // The popup turns the feature off after this page loaded
      local.items.TestFeature = { enabled: false, color: "red" };
      await settingsService.setStorageItem(feature, "cache", "fetched");

      expect(local.items.TestFeature).toEqual({ enabled: false, color: "red" });
    });
  });

  describe("updateFeatureSettings", () => {
    it("merges the changed field into the stored settings", async () => {
      local.items = { TestFeature: { enabled: true, color: "red" } };
      // Snapshot read before another context changes the color
      await settingsService.getFeatureSettings(feature);
      local.items.TestFeature = { enabled: true, color: "blue" };

      await settingsService.updateFeatureSettings("TestFeature", {
        enabled: false,
      });

      expect(local.items.TestFeature).toEqual({ enabled: false, color: "blue" });
    });
  });

  describe("initializeFeatureSettings", () => {
    it("reads every feature in one call and later reads come from the cache", async () => {
      local.items = {
        TestFeature: { enabled: true, color: "red" },
        "TestFeature:storage": { storage_cache: {}, storage_lastFetch: 1 },
        PlainFeature: { enabled: true },
      };
      const getMany = jest.spyOn(local, "getMany");
      const get = jest.spyOn(local, "get");

      const initialized = await settingsService.initializeFeatureSettings([
        feature,
        plainFeature,
      ]);
      expect(getMany).toHaveBeenCalledTimes(1);
      expect(getMany).toHaveBeenCalledWith([
        "TestFeature",
        "TestFeature:storage",
        "PlainFeature",
      ]);
      expect(initialized).toEqual({
        TestFeature: {
          enabled: true,
          color: "red",
          storage_cache: {},
          storage_lastFetch: 1,
        },
        PlainFeature: { enabled: true },
      });

      // Another feature's service shares the same StorageService cache
      await new SettingsService(storage).getStorageItem(feature, "lastFetch");
      expect(get).not.toHaveBeenCalled();
    });

    it("writes every feature's missing defaults with one setAll", async () => {
      local.items = { PlainFeature: { enabled: true } };
      const set = jest.spyOn(local, "set");
      const setAll = jest.spyOn(local, "setAll");

      await settingsService.initializeFeatureSettings([
        feature,
        plainFeature,
        { ...plainFeature, class: "OtherFeature" } as Feature,
      ]);

      expect(set).not.toHaveBeenCalled();
      expect(setAll).toHaveBeenCalledTimes(1);
      expect(setAll).toHaveBeenCalledWith({
        TestFeature: { enabled: true, color: "red" },
        "TestFeature:storage": {
          storage_cache: { entries: [] },
          storage_lastFetch: 0,
        },
        OtherFeature: { enabled: false },
      });
      expect(local.items.PlainFeature).toEqual({ enabled: true });
    });

    it("merges defaults into the latest stored value, not the cache", async () => {
      local.items = { TestFeature: { enabled: true } };
      await settingsService.getFeatureSettings(feature);
      // The popup turns the feature off after the cache was filled
      local.items.TestFeature = { enabled: false };

      await settingsService.initializeFeatureSettings([feature]);

      expect(local.items.TestFeature).toEqual({ enabled: false, color: "red" });
    });

    it("creates defaults under separate settings and storage keys", async () => {
      const { TestFeature: settings } =
        await settingsService.initializeFeatureSettings([feature]);

      expect(local.items.TestFeature).toEqual({ enabled: true, color: "red" });
      expect(local.items["TestFeature:storage"]).toEqual({
        storage_cache: { entries: [] },
        storage_lastFetch: 0,
      });
      expect(settings).toEqual({
        enabled: true,
        color: "red",
        storage_cache: { entries: [] },
        storage_lastFetch: 0,
      });
    });

    it("migrates storage items out of the settings object", async () => {
      local.items = {
        TestFeature: {
          enabled: false,
          color: "blue",
          storage_cache: { entries: [1, 2] },
          storage_lastFetch: 42,
        },
      };

      const { TestFeature: settings } =
        await settingsService.initializeFeatureSettings([feature]);

      expect(local.items.TestFeature).toEqual({ enabled: false, color: "blue" });
      expect(local.items["TestFeature:storage"]).toEqual({
        storage_cache: { entries: [1, 2] },
        storage_lastFetch: 42,
      });
      expect(settings).toEqual({
        enabled: false,
        color: "blue",
        storage_cache: { entries: [1, 2] },
        storage_lastFetch: 42,
      });
    });

    it("fills in storage items added since the migration", async () => {
      local.items = {
        TestFeature: { enabled: false, color: "blue" },
        "TestFeature:storage": { storage_cache: { entries: [3] } },
      };

      await settingsService.initializeFeatureSettings([feature]);

      expect(local.items["TestFeature:storage"]).toEqual({
        storage_cache: { entries: [3] },
        storage_lastFetch: 0,
      });
      expect(local.items.TestFeature).toEqual({ enabled: false, color: "blue" });
    });

    it("keeps already-migrated data over stale pre-migration copies", async () => {
      local.items = {
        TestFeature: { enabled: true, color: "red", storage_cache: "stale" },
        "TestFeature:storage": { storage_cache: "current", storage_lastFetch: 9 },
      };

      await settingsService.initializeFeatureSettings([feature]);

      expect(local.items["TestFeature:storage"]).toEqual({
        storage_cache: "current",
        storage_lastFetch: 9,
      });
      expect(local.items.TestFeature).toEqual({ enabled: true, color: "red" });
    });

    it("does not write when everything is already initialized", async () => {
      local.items = {
        TestFeature: { enabled: true, color: "red" },
        "TestFeature:storage": { storage_cache: {}, storage_lastFetch: 1 },
      };
      const set = jest.spyOn(local, "set");
      const setAll = jest.spyOn(local, "setAll");

      await settingsService.initializeFeatureSettings([feature]);

      expect(set).not.toHaveBeenCalled();
      expect(setAll).not.toHaveBeenCalled();
    });

    it("rejects when the write fails", async () => {
      jest
        .spyOn(local, "setAll")
        .mockRejectedValue(new Error("QUOTA_BYTES quota exceeded"));

      await expect(
        settingsService.initializeFeatureSettings([feature])
      ).rejects.toThrow("QUOTA_BYTES");
    });
  });

  describe("resetStorageItems", () => {
    it("resets cached data without touching settings", async () => {
      local.items = {
        TestFeature: { enabled: false, color: "blue", storage_cache: "legacy" },
        "TestFeature:storage": { storage_cache: "x", storage_lastFetch: 5 },
      };

      await settingsService.resetStorageItems(feature);

      expect(local.items["TestFeature:storage"]).toEqual({
        storage_cache: { entries: [] },
        storage_lastFetch: 0,
      });
      expect(local.items.TestFeature).toEqual({ enabled: false, color: "blue" });
    });
  });

  describe("resetAllStorageItems", () => {
    it("resets every feature's cached data with one setAll", async () => {
      const otherFeature = { ...feature, class: "OtherFeature" } as Feature;
      local.items = {
        TestFeature: { enabled: true, color: "red" },
        "TestFeature:storage": { storage_cache: "x", storage_lastFetch: 5 },
        OtherFeature: { enabled: false, color: "blue", storage_lastFetch: 3 },
        "OtherFeature:storage": { storage_cache: "y", storage_lastFetch: 6 },
      };
      const setAll = jest.spyOn(local, "setAll");

      const updated = await settingsService.resetAllStorageItems([
        feature,
        plainFeature,
        otherFeature,
      ]);

      const defaults = {
        storage_cache: { entries: [] as number[] },
        storage_lastFetch: 0,
      };
      expect(setAll).toHaveBeenCalledTimes(1);
      expect(updated).toEqual({ TestFeature: defaults, OtherFeature: defaults });
      expect(local.items).toEqual({
        TestFeature: { enabled: true, color: "red" },
        "TestFeature:storage": defaults,
        OtherFeature: { enabled: false, color: "blue" },
        "OtherFeature:storage": defaults,
      });
    });
  });
});
