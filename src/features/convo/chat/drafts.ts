/**
 * Unsent text in chat windows, kept in this tab's sessionStorage so it
 * survives going to another page and is gone when the tab closes. Keys name
 * the chat: "dm:<party>", "group:<gid>" or "global".
 */

const KEY = "hfx-chat-drafts";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const session = (): Store | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export function loadDrafts(store = session()): Map<string, string> {
  try {
    const saved = JSON.parse(store?.getItem(KEY) ?? "{}");
    return new Map(
      Object.entries(saved ?? {}).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    );
  } catch {
    return new Map();
  }
}

/** Replace the saved drafts with these, leaving out empty ones. */
export function saveDrafts(drafts: Map<string, string>, store = session()) {
  const kept = Object.fromEntries(
    Array.from(drafts).filter(([, text]) => text.trim())
  );
  try {
    if (Object.keys(kept).length) store?.setItem(KEY, JSON.stringify(kept));
    else store?.removeItem(KEY);
  } catch {
    // Storage full or blocked: the drafts just don't carry over
  }
}
