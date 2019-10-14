class Util {
  constructor() {
    this.features = {};
  }

  clearStorage() {
    HFX.Settings.clear();
  }

  hasOwnPropertyStructure(object, ...properties) {
    for (const property of properties) {
      if (property === null) {
        return true;
      } else if (!(property in object)) {
        return false;
      }

      object = object[property];
    }

    return true;
  }

  sendMessage(message, response) {
    chrome.runtime.sendMessage(message, response);
  }

  isBackground() {
    return chrome !== undefined && chrome.extension !== undefined && chrome.extension.getBackgroundPage !== undefined && chrome.extension.getBackgroundPage() === window;
  }

  isPopup() {
    return chrome !== undefined && chrome.extension !== undefined && chrome.extension.getBackgroundPage !== undefined && chrome.extension.getBackgroundPage() !== window;
  }

  isContentScript() {
    return chrome !== undefined && chrome.extension !== undefined && chrome.extension.getBackgroundPage === undefined;
  }

  getLoadedFeatures() {
    return this.features;
  }

  trackLoadedFeature(feature) {
    this.features[feature.class] = feature;
  }
};

module.exports = new Util();
