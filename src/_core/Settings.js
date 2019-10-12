const queue = {};
class Settings {
  // TODO: Update all attributes so if an extension update moves a feature, it will update
  getFeatureSettings (section, key, defaultOpt, name, description, id, author, Feature, cb) {
    chrome.storage.sync.get(section, (items) => {
      if (Object.keys(items).length === 0) {
        return cb(null, Feature);
      }

      if (items[section][key] === undefined) {
        return cb(null, Feature);
      }

      return cb(items[section][key], Feature);
    });
  }

  create (section, key, defaultOpt, name, description, id, author, cb) {
    if (!(section in queue)) {
      queue[section] = {};
      queue[section].items = [];
      queue[section].running = false;
    }

    queue[section].items.push({ "key": key, "defaultOpt": defaultOpt, "name": name, "description": description, "id": id, "author": author, "cb": cb, "purpose": "create" });
    this.processQueue(section);
  }

  update (section, key, setting, value) {
    if (!(section in queue)) {
      queue[section] = {};
      queue[section].items = [];
      queue[section].running = false;
    }

    queue[section].items.push({ "key": key, "setting": setting, "value": value, "purpose": "update" });
    this.processQueue(section);
  }

  processQueue (section) {
    if (queue[section].items.length === 0 || queue[section].running) {
      return false;
    }

    queue[section].running = true;
    const purpose = queue[section].items[0].purpose;

    chrome.storage.sync.get(section, (items) => {
      if (purpose === "create") {
        const key = queue[section].items[0].key;
        const defaultOpt = queue[section].items[0].defaultOpt;
        const name = queue[section].items[0].name;
        const description = queue[section].items[0].description;
        const id = queue[section].items[0].id;
        const author = queue[section].items[0].author;
        const cb = queue[section].items[0].cb;

        if (Object.keys(items).length === 0) {
          items[section] = {};
          items[section][key] = {};
          items[section][key]["default"] = defaultOpt;
          items[section][key]["enabled"] = defaultOpt;
          items[section][key]["name"] = name;
          items[section][key]["description"] = description;
          items[section][key]["id"] = id;
          items[section][key]["author"] = author;
          chrome.storage.sync.set(items, () => {
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
          chrome.storage.sync.set(items, () => {
            HFX.Logger.debug(`Added ${key} in ${section}`);
            HFX.Settings.proceedQueue(section);
            cb();
          });
        }
      } else if (purpose === "update") {
        const key = queue[section].items[0].key;
        const setting = queue[section].items[0].setting;
        const value = queue[section].items[0].value;

        items[section][key][setting] = value;
        chrome.storage.sync.set(items, () => {
          HFX.Logger.debug(`Updated ${key}:${setting}`);
          HFX.Settings.proceedQueue(section);
        });
      }
    });
  }

  proceedQueue (section) {
    queue[section].running = false;
    queue[section].items.shift();
    this.processQueue(section);
  }

  printSettings () {
    chrome.storage.sync.get(null, (items) => {
      HFX.Logger.debug("Items: ", items);
    });
  }

  exists (section, key, setting, cb) {
    chrome.storage.sync.get(section, (items) => {
      return cb(HFX.Util.hasOwnPropertyStructure(items, section, key, setting));
    });
  }

  get (section, key, setting, cb) {
    chrome.storage.sync.get(section, (items) => {
      return cb(HFX.Util.hasOwnPropertyStructure(items, section, key, setting) ? items[section][key][setting] : null);
    });
  }

  set (section, key, setting, value) {
    HFX.Logger.warn("Unsafe storage updating.");
    chrome.storage.sync.get(section, (items) => {
      items[section][key][setting] = value;
      chrome.storage.sync.set(items, () => {
        HFX.Logger.debug(`Updated ${key}:${setting}`);
      });
    });
  }

  clear () {
    chrome.storage.sync.clear(() => {
      HFX.Logger.log("Cleared storage");
    });
  }

  getTotal (cb) {
    chrome.storage.sync.get(null, (items) => {
      return cb(Object.keys(items).length);
    });
  }
};

module.exports = new Settings();
