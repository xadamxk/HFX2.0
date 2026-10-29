/**
 * Static storage keys
 */
export enum STORAGE_KEYS {
  SELECTOR_MANAGER_ERRORS = "ges_selector_manager_errors",
}

export interface StorageItemOption<T> {
  id: string;
  description: string;
  defaultValue: T;
}

/** Prefix for a storage item's field name, e.g. `storage_badgeMap`. */
export const STORAGE_ITEM_PREFIX = "storage_";

/** Suffix for the key holding a feature's cached data, e.g. `HFXBadges:storage`. */
export const FEATURE_STORAGE_SUFFIX = ":storage";

/** Prefix for global, extension-internal keys (e.g. selector error logs). */
export const GLOBAL_KEY_PREFIX = "ges_";

/**
 * The chrome.storage.local key holding a feature's cached data (storage items).
 * Kept separate from the feature's settings key so cached data never syncs.
 */
export function getFeatureStorageKey(featureClass: string): string {
  return `${featureClass}${FEATURE_STORAGE_SUFFIX}`;
}

export function isStorageItemField(field: string): boolean {
  return field.startsWith(STORAGE_ITEM_PREFIX);
}

/**
 * Keys that hold cached or internal data and must never be mirrored to
 * chrome.storage.sync. Everything else in local storage is user settings.
 */
export function isLocalOnlyKey(key: string): boolean {
  return (
    key.startsWith("_") ||
    key.startsWith(GLOBAL_KEY_PREFIX) ||
    key.endsWith(FEATURE_STORAGE_SUFFIX)
  );
}

/** Copy of a settings object without its `storage_<id>` fields. */
export function withoutStorageItems(settings: { [key: string]: any } | undefined): {
  [key: string]: any;
} {
  const result: { [key: string]: any } = {};
  const source = settings ?? {};
  for (const field of Object.keys(source)) {
    if (!isStorageItemField(field)) {
      result[field] = source[field];
    }
  }
  return result;
}

/** chrome.storage.sync.QUOTA_BYTES_PER_ITEM */
export const SYNC_QUOTA_BYTES_PER_ITEM = 8192;

/**
 * Size of an item as chrome.storage.sync counts it: key length plus the
 * UTF-8 length of the JSON-serialized value.
 */
export function getSyncItemSize(key: string, value: any): number {
  return utf8Length(key) + utf8Length(JSON.stringify(value) ?? "");
}

function utf8Length(text: string): number {
  let length = 0;
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;
    length +=
      codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
  }
  return length;
}

/** Only the `storage_<id>` fields of a settings object. */
export function onlyStorageItems(settings: { [key: string]: any } | undefined): {
  [key: string]: any;
} {
  const result: { [key: string]: any } = {};
  const source = settings ?? {};
  for (const field of Object.keys(source)) {
    if (isStorageItemField(field)) {
      result[field] = source[field];
    }
  }
  return result;
}
