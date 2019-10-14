class Settings {
  constructor() {
    this.queue = {};
  }

  // TODO: Update all attributes so if an extension update moves a feature, it will update
  getFeatureSettings(section, key, cb) {
    chrome.storage.local.get(section, (items) => {
      if (Object.keys(items).length === 0 || items[section][key] === undefined) {
        cb(null);
      } else {
        cb(items[section][key]);
      }
    });
  }

  // Uses the queue in background so that queued items aren't lost on tab close/navigation
  create(section, key, defaultOpt, name, description, id, author, cb) {
    if (HFX.Util.isContentScript()) {
      HFX.Util.sendMessage({ "action": "create", "object": { "section": section, "key": key, "defaultOpt": defaultOpt, "name": name, "description": description, "id": id, "author": author } }, (response) => {
        cb();
      });
    } else if (HFX.Util.isBackground()) {
      if (!(section in this.queue)) {
        this.queue[section] = {};
        this.queue[section].items = [];
        this.queue[section].running = false;
      }

      this.queue[section].items.push({ "key": key, "defaultOpt": defaultOpt, "name": name, "description": description, "id": id, "author": author, "cb": cb, "purpose": "create" });
      this.processQueue(section);
    }
  }

  // Uses the queue in background so that queued items aren't lost on tab close/navigation
  update(section, key, setting, value) {
    if (HFX.Util.isContentScript()) {
      HFX.Util.sendMessage({ "action": "update", "object": { "section": section, "key": key, "setting": setting, "value": value } });
    } else if (HFX.Util.isBackground()) {
      if (!(section in this.queue)) {
        this.queue[section] = {};
        this.queue[section].items = [];
        this.queue[section].running = false;
      }

      this.queue[section].items.push({ "key": key, "setting": setting, "value": value, "purpose": "update" });
      this.processQueue(section);
    }
  }

  processQueue(section) {
    if (this.queue[section].items.length === 0 || this.queue[section].running) {
      return false;
    }

    this.queue[section].running = true;
    const purpose = this.queue[section].items[0].purpose;

    chrome.storage.local.get(section, (items) => {
      if (purpose === "create") {
        const key = this.queue[section].items[0].key;
        const defaultOpt = this.queue[section].items[0].defaultOpt;
        const name = this.queue[section].items[0].name;
        const description = this.queue[section].items[0].description;
        const id = this.queue[section].items[0].id;
        const author = this.queue[section].items[0].author;
        const cb = this.queue[section].items[0].cb;

        if (Object.keys(items).length === 0) {
          items[section] = {};
          items[section][key] = {};
          items[section][key]["default"] = defaultOpt;
          items[section][key]["enabled"] = defaultOpt;
          items[section][key]["name"] = name;
          items[section][key]["description"] = description;
          items[section][key]["id"] = id;
          items[section][key]["author"] = author;
          chrome.storage.local.set(items, () => {
            HFX.Logger.debug(`Added ${key} AND ${section}`);
            HFX.Settings.proceedQueue(section);
            cb();
          });
        } else {
          items[section][key] = {};
          items[section][key]["default"] = defaultOpt;
          items[section][key]["enabled"] = defaultOpt;
          items[section][key]["name"] = name;
          items[section][key]["description"] = description;
          items[section][key]["id"] = id;
          items[section][key]["author"] = author;
          chrome.storage.local.set(items, () => {
            HFX.Logger.debug(`Added ${key} in ${section}`);
            HFX.Settings.proceedQueue(section);
            cb();
          });
        }
      } else if (purpose === "update") {
        const key = this.queue[section].items[0].key;
        const setting = this.queue[section].items[0].setting;
        const value = this.queue[section].items[0].value;

        items[section][key][setting] = value;
        chrome.storage.local.set(items, () => {
          HFX.Logger.debug(`Updated ${key}:${setting}`);
          HFX.Settings.proceedQueue(section);
        });
      }
    });
  }

  proceedQueue(section) {
    this.queue[section].running = false;
    this.queue[section].items.shift();
    this.processQueue(section);
  }

  printSettings() {
    chrome.storage.local.get(null, (items) => {
      HFX.Logger.debug("Items: ", items);
    });
  }

  exists(section, key, setting, cb) {
    chrome.storage.local.get(section, (items) => {
      cb(HFX.Util.hasOwnPropertyStructure(items, section, key, setting));
    });
  }

  get(section, key, setting, cb) {
    chrome.storage.local.get(section, (items) => {
      cb(HFX.Util.hasOwnPropertyStructure(items, section, key, setting) ? items[section][key][setting] : null);
    });
  }

  set(section, key, setting, value) {
    HFX.Logger.warn("Unsafe storage updating.");
    chrome.storage.local.get(section, (items) => {
      items[section][key][setting] = value;
      chrome.storage.local.set(items, () => {
        HFX.Logger.debug(`Updated ${key}:${setting}`);
      });
    });
  }

  clear() {
    chrome.storage.local.clear(() => {
      HFX.Logger.log("Cleared storage");
    });
  }

  getTotal(cb) {
    chrome.storage.local.get(null, (items) => {
      cb(Object.keys(items).length);
    });
  }
};

module.exports = new Settings();
