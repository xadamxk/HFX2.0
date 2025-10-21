import { StorageItemOption } from "./constants";
import { Feature } from "./Feature";
import { Logger } from "./Logger";
import { StorageService } from "./StorageService";

/**
 * SettingsService is responsible for managing settings for a feature.
 * These settings are accessible via the Extension settings and stored in the browser's storage.
 *
 * @param {StorageService} storage - The storage service to use for storing settings.
 */
export class SettingsService {
  constructor(private storage: StorageService) {
    this.storage = storage;
  }

  /**
   * Get all settings (configurables and storage items) for a feature.
   */
  async getFeatureSettings(feature: Feature): Promise<any> {
    return await this.storage.get(feature.class);
  }

  /**
   * Set all settings (configurables and storage items) for a feature.
   */
  async setFeatureSettings(feature: Feature, settings: any): Promise<void> {
    await this.storage.set(feature.class, settings);
    Logger.debug(`Updated settings for ${feature.class}.`);
  }

  /**
   * Initialize all settings (configurables and storage items) for a feature.
   */
  async initializeFeatureSettings(
    feature: Feature,
    existingSettings?: { [key: string]: any }
  ): Promise<{ [key: string]: any }> {
    // Start from existing settings if provided; otherwise create a new object
    const settings: { [key: string]: any } = existingSettings
      ? { ...existingSettings }
      : {};

    let needsUpdate = false;

    // Ensure enabled flag exists
    if (!("enabled" in settings)) {
      settings.enabled = feature.enabled;
      needsUpdate = true;
    }

    // Ensure configurables exist with default values
    if (feature.configurables && Array.isArray(feature.configurables)) {
      feature.configurables.forEach((configurable: any) => {
        const settingsKey = configurable.id;
        if (!(settingsKey in settings)) {
          settings[settingsKey] = configurable.default;
          needsUpdate = true;
        }
      });
    }

    // Ensure storage items exist with default values
    if (feature.storageItems && Array.isArray(feature.storageItems)) {
      feature.storageItems.forEach(
        (storageItem: StorageItemOption<unknown>) => {
          const storageKey = `storage_${storageItem.id}`;
          if (!(storageKey in settings)) {
            settings[storageKey] = storageItem.defaultValue;
            needsUpdate = true;
          }
        }
      );
    }

    // Persist settings when newly created or when we added missing defaults
    if (!existingSettings || needsUpdate) {
      await this.setFeatureSettings(feature, settings);
    }

    return settings;
  }

  /**
   * Get a single storage item for a feature.
   */
  async getStorageItem(feature: Feature, storageItemId: string): Promise<any> {
    const settings = await this.getFeatureSettings(feature);
    const storageKey = `storage_${storageItemId}`;
    return settings?.[storageKey];
  }

  /**
   * Set a single storage item for a feature.
   */
  async setStorageItem(
    feature: Feature,
    storageItemId: string,
    value: any
  ): Promise<void> {
    const settings = await this.getFeatureSettings(feature);
    const storageKey = `storage_${storageItemId}`;
    settings[storageKey] = value;
    await this.setFeatureSettings(feature, settings);
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
