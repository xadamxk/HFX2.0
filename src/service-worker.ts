import { Logger } from "./core/Logger";
import { SettingsService } from "./core/SettingsService";
import { StorageSyncService } from "./core/StorageSyncService";
import { StorageService } from "./core/StorageService";

const storageService = new StorageService();
const syncService = new StorageSyncService(storageService);

// MV3 service workers are stopped when idle and re-run this script when woken.
// Listeners must be registered synchronously at the top level so they exist
// (and can wake the worker) after every restart, not only after install.
syncService.listen();

chrome.runtime.onInstalled.addListener(async () => {
  Logger.debug("HFX Installed");

  try {
    await syncService.reconcile();
  } catch (error) {
    Logger.error("Failed to reconcile local and sync storage:", error);
  }

  new SettingsService(storageService).printSettings();
});
