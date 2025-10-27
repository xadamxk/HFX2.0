import { Util } from "./Util";
import React from "react";

/**
 * A section is a collection of features that are enabled on a specific page.
 * @param locations - The locations that this section is enabled on (e.g. "/settings", "/").
 * @param selectorElements - The elements that are used to determine if this section is enabled.
 */
export class Section {
  class: string;
  name: string;
  paths: string[];
  elementSelectors?: string[];
  icon?: React.ComponentType<{ className?: string }>; // Heroicon component
  constructor(
    paths: string[] = [],
    elementSelectors: string[] = [],
    icon?: React.ComponentType<{ className?: string }>
  ) {
    this.paths = [...paths];
    this.elementSelectors =
      elementSelectors.length === 0 ? [] : [...elementSelectors];
    this.icon = icon;
  }

  runnable() {
    // Only run if we're in a content script
    if (!Util.isContentScript()) {
      return false;
    }

    // Handle null/undefined pathname gracefully
    const pathname = document.location?.pathname;
    if (pathname == null) {
      return false;
    }

    const isLocationMatch =
      this.paths.some((path) => {
        try {
          const regex = new RegExp(path);
          return pathname.startsWith(path) || regex.test(pathname);
        } catch (error) {
          // Handle invalid regex patterns gracefully
          console.warn(`Invalid regex pattern in Section: ${path}`, error);
          return pathname.startsWith(path);
        }
      }) || false;

    const isSelectorMatch =
      this.elementSelectors.some((element) => {
        try {
          return document.querySelector(element);
        } catch (error) {
          // Handle querySelector errors gracefully
          console.warn(`Error querying selector in Section: ${element}`, error);
          return false;
        }
      }) || false;

    const isLocationRequired = this.paths.length > 0;
    const isSelectorRequired = this.elementSelectors.length > 0;
    if (isLocationRequired && isSelectorRequired) {
      return isLocationMatch && isSelectorMatch;
    } else if (isLocationRequired) {
      return isLocationMatch;
    } else if (isSelectorRequired) {
      return isSelectorMatch;
    }

    // Return false when no paths or selectors are configured
    return false;
  }
}
