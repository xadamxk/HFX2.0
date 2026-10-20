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

  /** Every error recorded on this page, for the console summary. */
  private readonly errors: SelectorErrorRecord[] = [];
  /** Errors recorded since the last persistErrors() call. */
  private unsaved: SelectorErrorRecord[] = [];
  private readonly storedKey = STORAGE_KEYS.SELECTOR_MANAGER_ERRORS;

  constructor(
    private readonly storage: StorageService = StorageService.getInstance()
  ) {}

  static getInstance(): SelectorManager {
    if (!this.instance) {
      this.instance = new SelectorManager();
    }
    return this.instance;
  }

  /**
   * Append the errors recorded since the last call to persisted storage in a
   * single write (bounded to the last 500). Called once after features load,
   * so several misses on one page don't each read and rewrite the whole list.
   */
  async persistErrors(): Promise<void> {
    if (this.unsaved.length === 0) return;
    const batch = this.unsaved;
    this.unsaved = [];
    try {
      await this.storage.update<SelectorErrorRecord[]>(
        this.storedKey,
        (current) => {
          const existing = Array.isArray(current) ? [...current] : [];
          existing.push(...batch);
          if (existing.length > 500) existing.splice(0, existing.length - 500);
          return existing;
        }
      );
    } catch {}
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
    this.unsaved.push(record);
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
}

export default SelectorManager;
