import { Logger } from "./core/Logger";
import { SettingsService } from "./core/SettingsService";
import { StorageSyncService } from "./core/StorageSyncService";
import { StorageService } from "./core/StorageService";

chrome.runtime.onInstalled.addListener(() => {
  Logger.debug("HFX Installed");

  // Initialize storage and services
  const storageService = new StorageService();
  const syncService = new StorageSyncService(storageService);
  const settingsService = new SettingsService(storageService);

  syncService.start();
  settingsService.printSettings();
});
