export class Util {
  static isServiceWorker() {
    return (
      chrome !== undefined &&
      chrome.runtime !== undefined &&
      chrome.runtime.getManifest !== undefined &&
      chrome.runtime.getManifest() !== undefined &&
      chrome.runtime.getManifest()?.name === "Service Worker"
    );
  }

  static isPopup() {
    return (
      chrome !== undefined &&
      chrome.extension !== undefined &&
      chrome.extension.getBackgroundPage !== undefined &&
      chrome.extension.getBackgroundPage() !== window
    );
  }

  static isContentScript() {
    return (
      chrome !== undefined &&
      chrome.extension !== undefined &&
      chrome.extension.getBackgroundPage === undefined
    );
  }

  static isDevelopment() {
    return (
      chrome !== undefined &&
      chrome.runtime !== undefined &&
      chrome.runtime.getManifest !== undefined &&
      chrome.runtime.getManifest() !== undefined &&
      !chrome.runtime.getManifest()?.update_url
    );
  }

  static getVersion() {
    return chrome.runtime.getManifest().version;
  }

  static getURL(resource: string) {
    return chrome.extension.getURL(resource);
  }

  static getLocalStorage(callBack: Function, key: string = null) {
    return chrome.storage.local.get(key, (result: any) => callBack(result));
  }
}
