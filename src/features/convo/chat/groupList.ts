import { fetchDocument } from "../../../core/Remote";

/**
 * The user's private group convos, read from the Comrades list on convo.php.
 * HF's Convo socket has no way to list them, so this is the one page Chat
 * Bubbles reads, and only when it has no cached list. Fetching /convo.php
 * opens no conversation, so it marks nothing read.
 */

export interface GroupInfo {
  /** The group id (an HF usergroup id), as in convo.php?action=group&gid=… */
  gid: number;
  name: string;
  /** Marked unread in the list when it was fetched. */
  unread?: boolean;
}

/** Group rows from a convo.php document. Throws if the inbox isn't there (logged out, layout change). */
export function parseGroupList(doc: Document): GroupInfo[] {
  const list = doc.getElementById("message-inbox-list-comrades");
  if (!list) throw new Error("convo.php has no Comrades list");
  const groups = new Map<number, GroupInfo>();
  list
    .querySelectorAll<HTMLAnchorElement>("a.message_inbox_row_groupmessage")
    .forEach((row) => {
      const gid = parseInt(
        (row.getAttribute("href") ?? "").match(/[?&]gid=(\d+)/)?.[1] ?? "",
        10
      );
      const name = row
        .querySelector(".message-inbox-details strong")
        ?.textContent?.trim();
      if (!gid || !name || groups.has(gid)) return;
      groups.set(gid, {
        gid,
        name,
        unread: row.classList.contains("message-inbox-details-preview-unread"),
      });
    });
  return Array.from(groups.values());
}

/** Fetch the user's groups from convo.php. */
export async function fetchGroupList(
  origin: string = location.origin
): Promise<GroupInfo[]> {
  return parseGroupList(await fetchDocument(`${origin}/convo.php`));
}
