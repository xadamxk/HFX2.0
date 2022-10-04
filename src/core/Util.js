module.exports = {
  features: {},

  sendMessage(message, response) {
    chrome.runtime.sendMessage(message, response);
  },

  isBackground() {
    return chrome !== undefined && chrome.extension !== undefined && chrome.extension.getBackgroundPage !== undefined && chrome.extension.getBackgroundPage() === window;
  },

  isPopup() {
    return chrome !== undefined && chrome.extension !== undefined && chrome.extension.getBackgroundPage !== undefined && chrome.extension.getBackgroundPage() !== window;
  },

  isContentScript() {
    return chrome !== undefined && chrome.extension !== undefined && chrome.extension.getBackgroundPage === undefined;
  },

  isDevelopment() {
    return chrome !== undefined && chrome.runtime !== undefined && chrome.runtime.getManifest !== undefined && chrome.runtime.getManifest() !== undefined && !("update_url" in chrome.runtime.getManifest());
  },

  getLoadedFeatures() {
    return this.features;
  },

  trackLoadedFeature(feature) {
    this.features[feature.class] = feature;
  },

  getVersion() {
    return chrome.runtime.getManifest().version;
  },

  getURL(resource) {
    return chrome.extension.getURL(resource);
  },

  getConfigurableValue(id, feature, settings) {
    let value;

    if (settings !== undefined && id in settings) {
      // Configurable matching ID has a value stored in settings
      value = settings[id];
    } else if (feature.configurables !== undefined) {
      // Get the default value of the Configurable matching ID
      const configurable = feature.configurables.get(id);
      value = configurable ? configurable.default : value;
    }

    return value;
  },

  checkParameters(parameters, options) {
    const result = {
      unset: [],
      invalid: []
    };

    // Check every defined parameter
    for (const parameter in parameters) {
      if (options[parameter] === undefined) {
        // Parameter is not provided (unset)
        result.unset.push(parameter);
      } else if (typeof parameters[parameter] === "function" && !(options[parameter] instanceof parameters[parameter])) {
        // Parameter does not match the correct class (invalid)
        result.invalid.push(parameter);
      } else if (typeof parameters[parameter] === "string" && !(typeof options[parameter] === parameters[parameter])) { // eslint-disable-line valid-typeof
        // Parameter does not match the correct primitive (invalid)
        result.invalid.push(parameter);
      } else if (typeof parameters[parameter] === "object") {
        const subresult = this.checkParameters(parameters[parameter], options[parameter]);
        result.unset.push(...subresult.unset.map(subparameter => `${parameter}.${subparameter}`));
        result.invalid.push(...subresult.invalid.map(subparameter => `${parameter}.${subparameter}`));
      }
    }

    return result;
  },

  addScriptToPage(scriptContent) {
    var script = document.createElement("script");
    script.textContent = scriptContent;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  },

  addCssToPage(cssContent) {
    var css = document.createElement("style");
    css.textContent = cssContent;
    (document.head || document.documentElement).appendChild(css);
  },

  getLocalStorageKeys() {
    chrome.storage.local.get(null, function(items) {
      console.log(Object.keys(items));
    });
  },

  saveLocalSetting(feature, key, value) {
    const storageKeyString = [feature.class, key].join(".");
    chrome.storage.local.set({ [storageKeyString]: value });
  },

  async getLocalSetting(feature, key) {
    const storageKeyString = [feature.class, key].join(".");
    try {
      var promise = new Promise(function(resolve, reject) {
        chrome.storage.local.get(storageKeyString, function(item) {
          resolve(item[storageKeyString]);
        });
      });
      const result = await promise;
      return result;
    } catch (error) {
      return {};
    }
  },

  clearLocalSetting(feature, key) {
    const storageKeyString = [feature.class, key].join(".");
    chrome.storage.local.remove(storageKeyString);
  },

  // TODO: move above to LibraryUtils
  replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, "g"), replace);
  },

  isAddressMatch(currentAddress, desiredAddress) {
    return currentAddress.includes(desiredAddress) ? currentAddress : "";
  },

  getUrlParameterValue(urlParameter) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(urlParameter) || null;
  },

  getUserPostKey() {
    return $("head").html().match(/my_post_key = "([a-f0-9]+)"/).pop() || null;
  }
};
