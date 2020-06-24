const Util = require("../core/Util");
const Logger = require("../core/Logger");

module.exports = {
  timeout: undefined,

  queuedChanges: {},

  syncDelay: 3000,

  start() {
    if (Util.isBackground()) {
      this.initializeLocal(() => this.keepSynced());
    }
  },

  initializeLocal(cb) {
    chrome.storage.sync.get(null, (items) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          Logger.error(chrome.runtime.lastError.message);
        }

        cb();
      });
    });
  },

  keepSynced() {
    if (chrome.storage.onChanged.hasListeners()) {
      Logger.warn("Potentially browserifying the Storage module in multiple locations.");
      return;
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (changes._syncIgnore && changes._syncIgnore.newValue.area === area) {
        return;
      }

      if (area === "local") {
        if (this.timeout !== undefined) {
          clearTimeout(this.timeout);
        }

        for (const key in changes) {
          this.queuedChanges[key] = changes[key];
        }

        this.timeout = setTimeout(() => {
          this.commitChanges("sync", chrome.storage.sync, this.queuedChanges);
          this.queuedChanges = {};
          this.timeout = undefined;
        }, this.syncDelay);
      } else {
        this.commitChanges("local", chrome.storage.local, changes);
      }
    });
  },

  commitChanges(area, storage, changes) {
    Logger.debug(`Committing changes to ${area}.`);
    const items = {};

    for (const key in changes) {
      items[key] = changes[key].newValue;
    }

    items._syncIgnore = { area: area, rand: Math.random() };

    storage.set(items, () => {
      if (chrome.runtime.lastError) {
        Logger.error(chrome.runtime.lastError.message);
      }
    });
  }
};
