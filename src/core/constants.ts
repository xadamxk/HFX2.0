/**
 * Static storage keys
 */
export enum STORAGE_KEYS {
  SELECTOR_MANAGER_ERRORS = "ges_selector_manager_errors",
  SELECTOR_MANAGER_SUPPRESSION = "ges_selector_manager_suppression",
}

export interface StorageItemOption<T> {
  id: string;
  description: string;
  defaultValue: T;
}
