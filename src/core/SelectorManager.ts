import { STORAGE_KEYS } from "./constants";
import { Logger } from "./Logger";
import { StorageService } from "./StorageService";

export interface SelectorErrorRecord {
  selector: string;
  url: string;
  feature?: string;
  timestamp: number;
  rootDescription?: string;
}

/**
 * SelectorManager centralizes DOM querying and tracks selector errors per page.
 * Features should use this instead of calling document.querySelector/All directly.
 */
export class SelectorManager {
  private static instance: SelectorManager | undefined;

  private readonly errors: SelectorErrorRecord[] = [];
  private readonly storedKey = STORAGE_KEYS.SELECTOR_MANAGER_ERRORS;
  private readonly suppressionKey = STORAGE_KEYS.SELECTOR_MANAGER_SUPPRESSION;
  private readonly storage: StorageService = new StorageService();

  static getInstance(): SelectorManager {
    if (!this.instance) {
      this.instance = new SelectorManager();
    }
    return this.instance;
  }

  /** Append a record to persisted storage (bounded to last 500). */
  private async logSelectorError(record: SelectorErrorRecord): Promise<void> {
    try {
      const existing: SelectorErrorRecord[] =
        (await this.storage.get(this.storedKey)) || [];
      existing.push(record);
      if (existing.length > 500) existing.splice(0, existing.length - 500);
      await this.storage.set(this.storedKey, existing);
    } catch {}
  }

  private async loadSelectorErrors(): Promise<SelectorErrorRecord[]> {
    try {
      const saved: SelectorErrorRecord[] =
        (await this.storage.get(this.storedKey)) || [];
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  /**
   * Query for a single element. Records an error when not found or on selector error.
   *
   * @param selector - The selector to query for.
   * @param root - The root element to query from.
   * @param isOptional - Whether the query is optional. If false, an error will be recorded if the selector is not found.
   * @param featureName - The name of the feature that is querying the selector.
   * @returns The element if found, otherwise null if isOptional is true.
   */
  query<T extends Element = Element>(
    selector: string,
    root?: ParentNode | Document,
    isOptional?: boolean,
    featureName?: string
  ): T | null {
    const queryRoot: ParentNode | Document = root ?? document;
    try {
      const el = (queryRoot as Document | Element).querySelector<T>(selector);
      if (!isOptional && !el) {
        throw new Error(`No elements found for selector: ${selector}`);
      }
      return el;
    } catch (error: any) {
      this.recordError(selector, featureName, this.describeRoot(queryRoot));
      return null;
    }
  }

  /**
   * Query for all matching elements. Records an error when none found or on selector error.
   *
   * @param selector - The selector to query for.
   * @param root - The root element to query from.
   * @param isOptional - Whether the query is optional. If false, an error will be recorded if no elements are found.
   * @param featureName - The name of the feature that is querying the selector.
   * @returns The elements if found, otherwise an empty array if isOptional is true.
   */
  queryAll<T extends Element = Element>(
    selector: string,
    root?: ParentNode | Document,
    isOptional?: boolean,
    featureName?: string
  ): T[] {
    const queryRoot: ParentNode | Document = root ?? document;
    try {
      const nodeList = (queryRoot as Document | Element).querySelectorAll<T>(
        selector
      );
      const results = Array.from(nodeList);
      if (!isOptional && results.length === 0) {
        throw new Error(`No elements found for selector: ${selector}`);
      }
      return results;
    } catch (error: any) {
      this.recordError(selector, featureName, this.describeRoot(queryRoot));
      return [] as T[];
    }
  }

  /** True if at least one element exists for the selector.
   *
   * @param selector - The selector to query for.
   * @param root - The root element to query from.
   * @param isOptional - Whether the query is optional. If false, an error will be recorded if no elements are found.
   * @param featureName - The name of the feature that is querying the selector.
   * @returns True if at least one element exists for the selector, otherwise false if isOptional is true.
   */
  exists(
    selector: string,
    root?: ParentNode | Document,
    isOptional?: boolean,
    featureName?: string
  ): boolean {
    return this.query(selector, root, isOptional, featureName) !== null;
  }

  getErrors(): SelectorErrorRecord[] {
    return [...this.errors];
  }

  async clearErrors(): Promise<void> {
    this.errors.length = 0;
    try {
      await this.storage.set(this.storedKey, []);
    } catch {}
  }

  private recordError(
    selector: string,
    featureName?: string,
    rootDescription?: string
  ): void {
    const record: SelectorErrorRecord = {
      selector,
      url: location.href.split("#")[0],
      feature: featureName,
      timestamp: Date.now(),
      rootDescription,
    };
    this.errors.push(record);
    // Fire-and-forget persistence
    this.logSelectorError(record);
    Logger.warn(
      `Selector error${featureName ? ` [${featureName}]` : ""}: ${selector}`
    );
  }

  private describeRoot(root: ParentNode | Document): string {
    try {
      if ((root as Document).nodeType === Node.DOCUMENT_NODE) {
        return "document";
      }
      const el = root as Element;
      const id = el.id ? `#${el.id}` : "";
      const cls = el.className
        ? `.${String(el.className).split(" ").join(".")}`
        : "";
      return `<${el.nodeName.toLowerCase()}${id}${cls}>`;
    } catch {
      return "unknown-root";
    }
  }

  /** Return true if we should show a toast now; handles suppression and threshold logic. */
  public async shouldShowToast(): Promise<boolean> {
    try {
      // suppression
      const suppressUntil: number | undefined = await this.storage.get(
        this.suppressionKey
      );
      const now = Date.now();
      if (typeof suppressUntil === "number" && now < suppressUntil) {
        return false;
      }

      // threshold: if a feature has >=3 errors in the last 24h on this origin
      const since = now - 24 * 60 * 60 * 1000;
      const persisted = await this.loadSelectorErrors();
      const combined = [...persisted, ...this.errors];
      // group by feature
      const byFeature: { [feature: string]: number } = {};
      for (const err of combined) {
        if (err.timestamp >= since) {
          const key = err.feature || "unknown";
          byFeature[key] = (byFeature[key] || 0) + 1;
          if (byFeature[key] >= 3) {
            return true;
          }
        }
      }
    } catch {}
    return false;
  }

  /** Suppress selector toasts for 3 days and clear current errors. */
  public async suppressToastsForThreeDays(): Promise<void> {
    try {
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      await this.storage.set(this.suppressionKey, Date.now() + threeDays);
      //   await this.storage.set(this.storedKey, []);
    } catch {}
    await this.clearErrors();
  }
}

export default SelectorManager;
