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
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime !== undefined &&
      typeof chrome.runtime.getManifest === "function"
    ) {
      const manifest = chrome.runtime.getManifest();
      return manifest?.version ?? "3.0";
    }
    return "";
  }

  static getURL(resource: string) {
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime !== undefined &&
      typeof chrome.runtime.getURL === "function"
    ) {
      return chrome.runtime.getURL(resource);
    }
    return resource.startsWith("/") ? resource : `/${resource}`;
  }

  static getLocalStorage(callBack: Function, key: string = null) {
    return chrome.storage.local.get(key, (result: any) => callBack(result));
  }
}
