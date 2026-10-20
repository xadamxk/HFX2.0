import type { Feature } from "./Feature";
import { SettingsService } from "./SettingsService";
import { StorageService } from "./StorageService";

/** A cached remote value and when it was fetched (epoch ms). */
export interface CachedValue<T> {
  value: T;
  fetchedAt: number;
}

let defaultSettingsService: SettingsService | undefined;
const inFlight: Map<string, Promise<unknown>> = new Map();

/**
 * Return a feature's cached remote value, refetching it once it is older than
 * `ttlMs`. The value is kept as `{ value, fetchedAt }` in the feature's
 * local-only storage item `key` (declare it in the feature's storageItems with
 * a `null` default so resetting the feature clears it).
 *
 * - Concurrent calls for the same feature and key share one fetch.
 * - If saving the fetched value fails, it is still returned.
 * - If the fetch fails, the stale cached value is returned when there is one;
 *   otherwise the error is thrown.
 * - A fetchedAt in the future (clock change) counts as expired.
 *
 * Pass the feature's own settingsService to reuse its primed storage cache.
 */
export async function getOrFetch<T>(
  feature: Feature,
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  settingsService: SettingsService = getDefaultSettingsService()
): Promise<T> {
  const cached = asCachedValue<T>(
    await settingsService.getStorageItem(feature, key)
  );
  const now = Date.now();
  if (cached && cached.fetchedAt <= now && now - cached.fetchedAt < ttlMs) {
    return cached.value;
  }

  const flightKey = `${feature.class}:${key}`;
  let pending = inFlight.get(flightKey) as Promise<T> | undefined;
  if (!pending) {
    pending = (async () => {
      const value = await fetcher();
      const entry: CachedValue<T> = { value, fetchedAt: Date.now() };
      try {
        await settingsService.setStorageItem(feature, key, entry);
      } catch (error) {
        // Still use what was fetched; the next page load refetches
        feature.logger.warn(`Caching ${key} failed: ${error}`);
      }
      return value;
    })();
    inFlight.set(flightKey, pending);
    pending
      .finally(() => inFlight.delete(flightKey))
      .catch((): void => undefined);
  }

  try {
    return await pending;
  } catch (error) {
    if (cached) {
      feature.logger.warn(
        `Fetching ${key} failed, using cached value: ${error}`
      );
      return cached.value;
    }
    throw error;
  }
}

function asCachedValue<T>(stored: unknown): CachedValue<T> | undefined {
  if (
    stored &&
    typeof stored === "object" &&
    "value" in stored &&
    typeof (stored as CachedValue<T>).fetchedAt === "number"
  ) {
    return stored as CachedValue<T>;
  }
  return undefined;
}

function getDefaultSettingsService(): SettingsService {
  if (!defaultSettingsService) {
    defaultSettingsService = new SettingsService(StorageService.getInstance());
  }
  return defaultSettingsService;
}

/**
 * Fetch a page and parse it as HTML. Rejects on network errors and non-2xx
 * responses (e.g. an HF error page or Cloudflare challenge), so callers don't
 * scrape a page that isn't the one they asked for.
 */
export async function fetchDocument(
  url: string,
  init?: RequestInit
): Promise<Document> {
  const res = await fetch(url, { credentials: "same-origin", ...init });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return new DOMParser().parseFromString(await res.text(), "text/html");
}

const sharedDocuments: Map<string, Promise<Document>> = new Map();

/** HF's group list, read by WhosOnlineSorting and GroupManagement. */
export const SHOWGROUPS_URL = "https://hackforums.net/showgroups.php";

/**
 * Like fetchDocument, but GET requests for the same URL share one fetch and
 * parse for the life of the page (e.g. several features reading
 * showgroups.php). A failed fetch is not kept, so a later call retries.
 * Callers must treat the returned Document as read-only.
 */
export function fetchSharedDocument(url: string): Promise<Document> {
  let pending = sharedDocuments.get(url);
  if (!pending) {
    pending = fetchDocument(url);
    sharedDocuments.set(url, pending);
    pending.catch(() => {
      if (sharedDocuments.get(url) === pending) sharedDocuments.delete(url);
    });
  }
  return pending;
}

/** Test hook: forget shared documents and in-flight fetches. */
export function resetRemoteCaches(): void {
  sharedDocuments.clear();
  inFlight.clear();
}
