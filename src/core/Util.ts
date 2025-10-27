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

  /** Common functions for content scripts */
  static getUserPostKey() {
    return (
      (Util.isContentScript() &&
        document.head.innerHTML.match(/my_post_key = "([a-f0-9]+)"/)?.pop()) ||
      null
    );
  }

  static getProfileUsername() {
    const container = document.querySelector(
      ".pro-adv-content-info"
    ) as HTMLElement | null;
    if (!container) return null;

    const firstCard = container.querySelector(
      ":scope > .pro-adv-card"
    ) as HTMLElement | null;
    if (!firstCard) return null;

    const nameEl = firstCard.querySelector(".largetext") as HTMLElement | null;
    const text = nameEl?.textContent?.trim() || "";
    return text || null;
  }
  static getProfileUserId() {
    return (
      parseInt(
        new URL(window.location.href).searchParams.get("uid") || "0",
        10
      ) || 0
    );
  }
}
