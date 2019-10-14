class Storage {
  constructor() {
    this.timeout = undefined;
    this.queuedChanges = {};
    this.syncDelay = 3000;
    this.start();
  }

  start() {
    if (HFX.Util.isBackground()) {
      this.initializeLocal(() => this.keepSynced());
    }
  }

  initializeLocal(cb) {
    chrome.storage.sync.get(null, (items) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          HFX.Logger.error(chrome.runtime.lastError.message);
        }

        cb();
      });
    });
  }

  keepSynced() {
    if (chrome.storage.onChanged.hasListeners()) {
      HFX.Logger.warn("Potentially browserifying the Storage module in multiple locations");
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
  }

  commitChanges(area, storage, changes) {
    HFX.Logger.debug(`Committing changes to ${area}`);
    const items = {};

    for (const key in changes) {
      items[key] = changes[key].newValue;
    }

    items._syncIgnore = { area: area, rand: Math.random() };

    storage.set(items, () => {
      if (chrome.runtime.lastError) {
        HFX.Logger.error(chrome.runtime.lastError.message);
      }
    });
  }
};

module.exports = new Storage();
