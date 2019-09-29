require("./HFX");
var queue = [];
class Settings {
  constructor () {
    this.running = false;
  }
  getFeatureSettings (section, key, defaultOpt, name, description, id, Feature, cb) {
    chrome.storage.sync.get(section, function (items) {
      if (Object.keys(items).length === 0) {
        return cb(null, Feature);
      }

      if (items[section][key] === undefined) {
        return cb(null, Feature);
      }

      return cb(items[section][key], Feature);
    });
  }

  create (section, key, defaultOpt, name, description, id) {
    queue.push({ "section": section, "key": key, "defaultOpt": defaultOpt, "name": name, "description": description, "id": id });
    this.processQueue();
  }

  processQueue () {
    if (queue.length === 0 || this.running) {
      return false;
    }
    this.running = true;
    var section = queue[0].section;
    var key = queue[0].key;
    var defaultOpt = queue[0].defaultOpt;
    var name = queue[0].name;
    var description = queue[0].description;
    var id = queue[0].id;
    chrome.storage.sync.get(section, function (items) {
      var keys = Object.keys(items);
      var obj = {};
      console.log(queue[0]);
      if (keys.length === 0) {
        obj[section] = {};
        obj[section][key] = {};
        obj[section][key]["default"] = defaultOpt;
        obj[section][key]["enabled"] = defaultOpt;
        obj[section][key]["name"] = name;
        obj[section][key]["description"] = description;
        obj[section][key]["id"] = id;
        chrome.storage.sync.set(obj, function () {
          HFX.Logger.debug(`Added ${key} AND ${section}`);
          HFX.Settings.proceedQueue();
        });
      } else {
        obj = items;
        obj[section][key] = {};
        obj[section][key]["default"] = defaultOpt;
        obj[section][key]["enabled"] = defaultOpt;
        obj[section][key]["name"] = name;
        obj[section][key]["description"] = description;
        obj[section][key]["id"] = id;
        chrome.storage.sync.set(obj, function () {
          HFX.Logger.debug(`Added ${key} in ${section}`);
          HFX.Settings.proceedQueue();
        });
      }
    });
  }

  proceedQueue () {
    this.running = false;
    queue.shift();
    this.processQueue();
  }

  printSettings () {
    chrome.storage.sync.get(null, function (items) {
      HFX.Logger.debug("Items: ", items);
    });
  }

  exists (section, key, setting, cb) {
    chrome.storage.sync.get(section, function (items) {
      if (setting === null) {
        return cb(Boolean(items[section][key]));
      } else {
        return cb(Boolean(items[section][key][setting]));
      }
    });
  }

  get (section, key, setting, cb) {
    chrome.storage.sync.get(section, function (items) {
      if (typeof items[section][key] === 'undefined' || typeof items[section][key][setting] === 'undefined') {
        return cb(null);
      }
      return cb(items[section][key][setting]);
    });
  }

  set (section, key, setting, value) {
    chrome.storage.sync.get(section, function (items) {
      var obj = items;
      obj[section][key][setting] = value;
      chrome.storage.sync.set(obj, function () {
        HFX.Logger.debug(`Updated ${key}:${setting}`);
      });
    });
  }

  clear () {
    chrome.storage.sync.clear(function () {
      HFX.Logger.log("Cleared storage");
    });
  }

  getTotal(cb) {
    chrome.storage.sync.get(null, function(items) {
      return cb(Object.keys(items).length);
    });
  }
};
module.exports = new Settings();
