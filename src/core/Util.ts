export class Util {
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

  /** Common functions for content scripts */
  static getUserPostKey() {
    return (
      (Util.isContentScript() &&
        document.head.innerHTML.match(/my_post_key = "([a-f0-9]+)"/)?.pop()) ||
      null
    );
  }

  /**
   * The logged-in user, from the header's "Welcome back" profile link.
   * Returns null when logged out or the link can't be found.
   */
  static getCurrentUser(): { uid: number; username: string } | null {
    const anchor = document.querySelector(
      ".welcome a"
    ) as HTMLAnchorElement | null;
    if (!anchor) return null;

    return {
      uid: Util.getUidFromHref(anchor.getAttribute("href")),
      username: (anchor.textContent || "").trim(),
    };
  }

  /**
   * Read the `uid` query parameter from a relative or absolute link, e.g. a
   * `member.php?action=profile&uid=123` profile link. Returns 0 if missing.
   */
  static getUidFromHref(href: string | null | undefined): number {
    if (!href) return 0;
    try {
      const url = new URL(href, "https://hackforums.net/");
      return parseInt(url.searchParams.get("uid") || "", 10) || 0;
    } catch {
      return 0;
    }
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

  static addCssToPage(css: string) {
    const cssElement = document.createElement("style");
    cssElement.textContent = css;
    (document.head || document.documentElement).appendChild(cssElement);
  }
}
