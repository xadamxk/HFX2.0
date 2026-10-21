import { fetchSharedDocument, SHOWGROUPS_URL } from "./Remote";

/**
 * HF's usergroup names by their username class, e.g. `{ group68: "Brotherhood" }`,
 * read from showgroups.php. WhosOnlineSorting stores it (storage items
 * `groupMap` and `groupMapNextFetch`) and Chat Bubbles reuses that cache.
 */
export type GroupMap = Record<string, string>;

// Refresh the group map daily so new groups don't stay "Unknown"
export const GROUP_MAP_TTL = 24 * 60 * 60 * 1000;
// After a failed or empty fetch, wait before trying showgroups.php again
export const GROUP_MAP_RETRY_DELAY = 60 * 60 * 1000;

/** Class → name pairs from a showgroups.php document. */
export function parseGroupMap(doc: Document): GroupMap {
  const map: GroupMap = {};
  doc.querySelectorAll(".groupName").forEach((container) => {
    const span = container.querySelector(
      "span > strong > span"
    ) as HTMLElement | null;
    if (!span) return;
    const className = span.className?.trim();
    const groupName = span.textContent?.trim();
    if (!className || !groupName) return;
    map[className] = groupName;
  });
  return map;
}

/**
 * Fetch the group map from showgroups.php. Null on a network/HTTP error or
 * when no groups were found (e.g. logged out).
 */
export async function fetchGroupMap(): Promise<GroupMap | null> {
  let doc: Document;
  try {
    // Shared with GroupManagement, so a page running both fetches it once
    doc = await fetchSharedDocument(SHOWGROUPS_URL);
  } catch {
    return null;
  }
  const map = parseGroupMap(doc);
  return Object.keys(map).length > 0 ? map : null;
}

export interface GroupMapCache {
  stored: GroupMap | undefined | null;
  /** When the map may be fetched again (ms since epoch). */
  nextFetch: number;
  save: (map: GroupMap | null, nextFetch: number) => Promise<void>;
}

/**
 * Use the stored group map while it's fresh, otherwise refetch it. Falls back
 * to the stored map if the refetch fails; null when there's no map at all.
 */
export async function resolveGroupMap(
  cache: GroupMapCache,
  fetchMap: () => Promise<GroupMap | null> = fetchGroupMap
): Promise<GroupMap | null> {
  const stored = cache.stored;
  const hasStored = !!stored && Object.keys(stored).length > 0;
  // Not due yet: either the map is fresh, or a recent fetch failed and we're waiting to retry
  if (Date.now() < cache.nextFetch) return hasStored ? stored! : null;

  const fetched = await fetchMap();
  if (fetched) {
    await cache.save(fetched, Date.now() + GROUP_MAP_TTL);
    return fetched;
  }
  await cache.save(null, Date.now() + GROUP_MAP_RETRY_DELAY);
  return hasStored ? stored! : null;
}

/** The group id in a username class like "group68", or 0. */
export function groupIdOf(className: string): number {
  const match = className.match(/^group(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}
