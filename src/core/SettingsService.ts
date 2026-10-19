import {
  StorageItemOption,
  STORAGE_ITEM_PREFIX,
  getFeatureStorageKey,
  onlyStorageItems,
  withoutStorageItems,
} from "./constants";
import { Feature } from "./Feature";
import { Logger } from "./Logger";
import { StorageService } from "./StorageService";

type SettingsObject = { [key: string]: any };

/**
 * SettingsService is responsible for managing settings for a feature.
 * These settings are accessible via the Extension settings and stored in the browser's storage.
 *
 * A feature's data lives under two chrome.storage.local keys:
 * - `<class>`: user settings (enabled flag and configurables), synced across devices.
 * - `<class>:storage`: cached data (`storage_<id>` storage items), local only.
 *
 * @param {StorageService} storage - The storage service to use for storing settings.
 */
export class SettingsService {
  constructor(private storage: StorageService) {
    this.storage = storage;
  }

  /**
   * Get the user settings (enabled flag and configurables) for a feature.
   */
  async getFeatureSettings(feature: Feature): Promise<any> {
    return await this.storage.get(feature.class);
  }

  /**
   * Get stored settings for many features in a single storage read. The
   * result is keyed by feature class (user settings) and, for features with
   * storage items, by `<class>:storage` (cached data). Keys that have never
   * been written are absent from the result.
   */
  async getFeatureSettingsBatch(
    features: Feature[]
  ): Promise<{ [key: string]: any }> {
    const keys: string[] = [];
    features.forEach((feature) => {
      keys.push(feature.class);
      if (feature.storageItems?.length) {
        keys.push(getFeatureStorageKey(feature.class));
      }
    });
    return await this.storage.getMany(keys);
  }

  /**
   * Cache values read elsewhere (e.g. via getFeatureSettingsBatch) so later
   * reads for this feature skip storage. Writes always re-read storage, so a
   * primed value can't be written back over a newer one.
   */
  primeFeatureSettings(
    feature: Feature,
    settings: any,
    storage?: { [key: string]: any }
  ): void {
    this.storage.prime(feature.class, settings);
    if (feature.storageItems?.length) {
      this.storage.prime(getFeatureStorageKey(feature.class), storage);
    }
  }

  /**
   * Replace the user settings (enabled flag and configurables) for a feature.
   * Storage items are ignored; use setStorageItem for those.
   */
  async setFeatureSettings(feature: Feature, settings: any): Promise<void> {
    await this.storage.set(feature.class, withoutStorageItems(settings));
    feature.logger.debug("Updated settings.");
  }

  /**
   * Merge `changes` into a feature's stored user settings, leaving every other
   * field as it currently is in storage.
   */
  async updateFeatureSettings(
    featureClass: string,
    changes: SettingsObject
  ): Promise<SettingsObject> {
    return await this.storage.update<SettingsObject>(featureClass, (current) => ({
      ...withoutStorageItems(current),
      ...changes,
    }));
  }

  /**
   * Get a feature's cached data, keyed by `storage_<id>`.
   */
  async getFeatureStorage(feature: Feature): Promise<SettingsObject | undefined> {
    return await this.storage.get(getFeatureStorageKey(feature.class));
  }

  /**
   * Initialize all settings (configurables and storage items) for a feature.
   *
   * Fills in missing defaults, migrates storage items that older versions kept
   * inside the settings object to the feature's own storage key, and returns
   * the combined view (settings plus `storage_<id>` fields) that features read.
   */
  async initializeFeatureSettings(
    feature: Feature,
    existingSettings?: { [key: string]: any }
  ): Promise<{ [key: string]: any }> {
    const legacyStorage = onlyStorageItems(existingSettings);
    const hasLegacyStorage = Object.keys(legacyStorage).length > 0;

    // Storage items first, so legacy values are copied before they are stripped
    let storage =
      feature.storageItems?.length || hasLegacyStorage
        ? await this.getFeatureStorage(feature)
        : undefined;
    if (hasLegacyStorage || this.hasMissingStorageItems(feature, storage)) {
      storage = await this.storage.update<SettingsObject>(
        getFeatureStorageKey(feature.class),
        (current) =>
          this.withStorageItemDefaults(feature, current ?? legacyStorage)
      );
    }

    let settings = withoutStorageItems(existingSettings);
    if (
      !existingSettings ||
      hasLegacyStorage ||
      this.hasMissingSettings(feature, settings)
    ) {
      settings = await this.storage.update<SettingsObject>(
        feature.class,
        (current) =>
          this.withSettingsDefaults(
            feature,
            withoutStorageItems(current)
          )
      );
      feature.logger.debug("Updated settings.");
    }

    return { ...settings, ...(storage ?? {}) };
  }

  /**
   * Get a single storage item for a feature.
   */
  async getStorageItem(feature: Feature, storageItemId: string): Promise<any> {
    const storage = await this.getFeatureStorage(feature);
    return storage?.[`${STORAGE_ITEM_PREFIX}${storageItemId}`];
  }

  /**
   * Set a single storage item for a feature. Only that item is written; the
   * feature's other storage items and its settings are left untouched.
   */
  async setStorageItem(
    feature: Feature,
    storageItemId: string,
    value: any
  ): Promise<void> {
    const storageKey = `${STORAGE_ITEM_PREFIX}${storageItemId}`;
    await this.storage.update<SettingsObject>(
      getFeatureStorageKey(feature.class),
      (current) => ({ ...(current ?? {}), [storageKey]: value })
    );
  }

  /**
   * Build the default values for a feature's storage items, keyed by their
   * settings key. Owns the `storage_<id>` key convention.
   */
  private getStorageItemDefaults(feature: Feature): { [key: string]: any } {
    const defaults: { [key: string]: any } = {};
    feature.storageItems?.forEach((storageItem: StorageItemOption<unknown>) => {
      defaults[`${STORAGE_ITEM_PREFIX}${storageItem.id}`] =
        this.cloneDefaultValue(storageItem.defaultValue);
    });
    return defaults;
  }

  /**
   * Storage item defaults are declared on the feature instance, so they must be
   * copied rather than referenced; otherwise settings would share (and mutate)
   * the feature's own default value.
   */
  private cloneDefaultValue<T>(value: T): T {
    if (value === null || typeof value !== "object") {
      return value;
    }
    return typeof structuredClone === "function"
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value));
  }

  private hasMissingSettings(
    feature: Feature,
    settings: SettingsObject
  ): boolean {
    return (
      !("enabled" in settings) ||
      (feature.configurables ?? []).some(
        (configurable: any) => !(configurable.id in settings)
      )
    );
  }

  private hasMissingStorageItems(
    feature: Feature,
    storage: SettingsObject | undefined
  ): boolean {
    return (feature.storageItems ?? []).some(
      (storageItem) =>
        !storage || !(`${STORAGE_ITEM_PREFIX}${storageItem.id}` in storage)
    );
  }

  private withSettingsDefaults(
    feature: Feature,
    settings: SettingsObject
  ): SettingsObject {
    const defaults: SettingsObject = { enabled: feature.enabled };
    (feature.configurables ?? []).forEach((configurable: any) => {
      defaults[configurable.id] = configurable.default;
    });
    return { ...defaults, ...settings };
  }

  private withStorageItemDefaults(
    feature: Feature,
    storage: SettingsObject
  ): SettingsObject {
    return { ...this.getStorageItemDefaults(feature), ...storage };
  }

  /**
   * Reset every storage item for a feature back to its default value,
   * leaving the feature's configurables and enabled flag untouched.
   * Returns the feature's updated storage items.
   */
  async resetStorageItems(feature: Feature): Promise<{ [key: string]: any }> {
    const defaults = this.getStorageItemDefaults(feature);

    if (Object.keys(defaults).length === 0) {
      return {};
    }

    await this.storage.set(getFeatureStorageKey(feature.class), defaults);
    // Drop pre-migration copies inside the settings so they can't be migrated back
    await this.storage.update<SettingsObject | undefined>(
      feature.class,
      (current) =>
        Object.keys(onlyStorageItems(current)).length > 0
          ? withoutStorageItems(current)
          : current
    );
    feature.logger.debug("Reset storage items.");
    return defaults;
  }

  /**
   * Reset storage items for multiple features. Returns a map of feature class
   * to that feature's updated storage items.
   */
  async resetAllStorageItems(
    features: Feature[]
  ): Promise<{ [featureClass: string]: any }> {
    const updatedStorage: { [featureClass: string]: any } = {};

    for (const feature of features) {
      if (!feature.storageItems?.length) continue;
      updatedStorage[feature.class] = await this.resetStorageItems(feature);
    }

    return updatedStorage;
  }

  async clear(): Promise<void> {
    await this.storage.clear();
    Logger.log("Cleared storage.");
  }

  async getAll(): Promise<{ [key: string]: any }> {
    return await this.storage.getAll();
  }

  async getTotal(): Promise<number> {
    const items = await this.getAll();
    return Object.keys(items).length;
  }

  async printSettings(): Promise<void> {
    const items = await this.getAll();
    Logger.debug("Items: ", items);
  }
}
