const Logger = require("../core/Logger");

module.exports = {
  get(feature, cb) {
    chrome.storage.local.get(feature.class, (settings) => {
      cb(feature.class in settings ? settings[feature.class] : undefined);
    });
  },

  set(feature, settings, cb) {
    const wrapped = {};
    wrapped[feature.class] = settings;

    chrome.storage.local.set(wrapped, () => {
      Logger.debug(`Updated settings for ${feature.class}.`);

      if (cb !== undefined && typeof cb === "function") {
        cb(wrapped[feature.class]);
      }
    });
  },

  create(feature, cb) {
    const settings = {
      enabled: feature.default
    };

    this.set(feature, settings, cb);
  },

  clear() {
    chrome.storage.local.clear(() => {
      Logger.log("Cleared storage.");
    });
  },

  getAll(cb) {
    chrome.storage.local.get(null, (items) => {
      cb(items);
    });
  },

  getTotal(cb) {
    this.getAll((items) => {
      cb(Object.keys(items).length);
    });
  },

  printSettings() {
    this.getAll((items) => {
      Logger.debug("Items: ", items);
    });
  }
};
