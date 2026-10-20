import { Util } from "./Util";

interface PathMatcher {
  pathname: string;
  // Paths ending in "/" match every page under them
  isPrefix: boolean;
  query: [string, string][];
}

/**
 * A section is a collection of features that are enabled on a specific page.
 * @param paths - The pages this section is enabled on, compared as plain text (no regex).
 *   A path ending in "/" matches everything under it ("/" matches every page); any other
 *   path must equal the page's pathname. A path may include a query string
 *   (e.g. "/member.php?action=profile"), whose parameters the page must also have.
 * @param selectorElements - The elements that are used to determine if this section is enabled.
 */
export class Section {
  class!: string;
  name!: string;
  paths: string[];
  elementSelectors: string[];
  private readonly matchers: PathMatcher[];
  // Many features share a section, so only check the page once per URL
  private cached?: { url: string; runnable: boolean };

  constructor(paths: string[] = [], elementSelectors: string[] = []) {
    if (!Array.isArray(paths) || !Array.isArray(elementSelectors)) {
      throw new TypeError(
        "Section paths and element selectors must be arrays of strings."
      );
    }
    this.paths = [...paths];
    this.elementSelectors = [...elementSelectors];
    this.matchers = this.paths.map((path) => Section.compilePath(path));
  }

  runnable(): boolean {
    // Only run if we're in a content script
    if (!Util.isContentScript()) {
      return false;
    }

    // Handle null/undefined pathname gracefully
    const location = document.location;
    if (location?.pathname == null) {
      return false;
    }

    const url = location.pathname + location.search;
    if (this.cached?.url !== url) {
      this.cached = {
        url,
        runnable: this.matches(location.pathname, location.search),
      };
    }
    return this.cached.runnable;
  }

  private matches(pathname: string, search: string): boolean {
    const isLocationRequired = this.matchers.length > 0;
    const isSelectorRequired = this.elementSelectors.length > 0;

    // Return false when no paths or selectors are configured
    if (!isLocationRequired && !isSelectorRequired) {
      return false;
    }
    if (isLocationRequired && !this.matchesLocation(pathname, search)) {
      return false;
    }
    return !isSelectorRequired || this.matchesSelector();
  }

  private matchesLocation(pathname: string, search: string): boolean {
    const params = new URLSearchParams(search);
    return this.matchers.some(
      (matcher) =>
        (matcher.isPrefix
          ? pathname.startsWith(matcher.pathname)
          : pathname === matcher.pathname) &&
        matcher.query.every(([key, value]) => params.get(key) === value)
    );
  }

  private matchesSelector(): boolean {
    return this.elementSelectors.some((element) => {
      try {
        return document.querySelector(element) !== null;
      } catch (error) {
        // Handle querySelector errors gracefully
        console.warn(`Error querying selector in Section: ${element}`, error);
        return false;
      }
    });
  }

  private static compilePath(path: string): PathMatcher {
    const queryStart = path.indexOf("?");
    const pathname = queryStart === -1 ? path : path.slice(0, queryStart);
    const query =
      queryStart === -1
        ? []
        : Array.from(new URLSearchParams(path.slice(queryStart)).entries());
    return { pathname, isPrefix: pathname.endsWith("/"), query };
  }
}
