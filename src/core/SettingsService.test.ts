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
      await settingsService.initializeFeatureSettings(
        feature,
        await settingsService.getFeatureSettings(feature)
      );

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
    it("creates defaults under separate settings and storage keys", async () => {
      const settings = await settingsService.initializeFeatureSettings(
        feature,
        undefined
      );

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

      const settings = await settingsService.initializeFeatureSettings(
        feature,
        await settingsService.getFeatureSettings(feature)
      );

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

    it("does not write when everything is already initialized", async () => {
      local.items = {
        TestFeature: { enabled: true, color: "red" },
        "TestFeature:storage": { storage_cache: {}, storage_lastFetch: 1 },
      };
      const set = jest.spyOn(local, "set");

      await settingsService.initializeFeatureSettings(
        feature,
        await settingsService.getFeatureSettings(feature)
      );

      expect(set).not.toHaveBeenCalled();
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
});
