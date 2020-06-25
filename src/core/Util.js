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

    if (settings && id in settings) {
      value = settings[id];
    } else if (feature.configurables) {
      value = feature.configurables.filter(cfg => cfg.id === id)[0];
      value = value ? value.default : value;
    }

    return value;
  }
};
