import type { ChatUser } from "./ConvoClient";

/**
 * HF's own "start a convo" links (convo.php?action=user&uid=N: the Convo
 * button on profiles and posts) opened in the dock instead of convo.php.
 * convo.php redirects such a link to the chat (convo.php?id=<party>), which
 * is the id the dock needs. Anything else (no chat with them yet, a failed
 * request, a dock that isn't connected) goes to convo.php as usual.
 */

/** The uid an HF convo link starts a chat with, or 0 if it isn't one. */
export function convoLinkUid(link: HTMLAnchorElement, origin: string): number {
  let url: URL;
  try {
    url = new URL(link.getAttribute("href") ?? "", `${origin}/`);
  } catch {
    return 0;
  }
  if (
    url.origin !== origin ||
    !/\/convo\.php$/i.test(url.pathname) ||
    url.searchParams.get("action") !== "user"
  ) {
    return 0;
  }
  const uid = Number(url.searchParams.get("uid"));
  return Number.isSafeInteger(uid) && uid > 0 ? uid : 0;
}

/**
 * The chat id convo.php sends a user's convo link to, or 0 when it doesn't
 * redirect to one. Made only when the link is clicked; the page itself isn't
 * read.
 */
export async function fetchConvoParty(
  uid: number,
  origin: string,
  fetchImpl: typeof fetch = fetch
): Promise<number> {
  const response = await fetchImpl(
    `${origin}/convo.php?action=user&uid=${uid}`,
    { credentials: "same-origin" }
  );
  response.body?.cancel().catch(() => undefined);
  if (!response.ok) return 0;
  const url = new URL(response.url, `${origin}/`);
  if (!/\/convo\.php$/i.test(url.pathname)) return 0;
  const party = Number(url.searchParams.get("id"));
  return Number.isSafeInteger(party) && party > 0 ? party : 0;
}

/**
 * The user's name and avatar from the page the link is on (a post's author,
 * a profile), so the window's header is right before its history loads.
 */
export function pageUserHint(
  uid: number,
  origin: string,
  doc: Document = document
): ChatUser | undefined {
  let username = "";
  let avatar = "";
  for (const link of Array.from(
    doc.querySelectorAll<HTMLAnchorElement>('a[href*="member.php"]')
  )) {
    let url: URL;
    try {
      url = new URL(link.getAttribute("href") ?? "", `${origin}/`);
    } catch {
      continue;
    }
    if (
      url.searchParams.get("action") !== "profile" ||
      Number(url.searchParams.get("uid")) !== uid
    ) {
      continue;
    }
    if (!username) username = link.textContent?.trim() ?? "";
    const img = link.querySelector("img");
    if (!avatar && img) avatar = sitePath(img.src, origin);
    if (username && avatar) break;
  }
  if (!username) return undefined;
  return { uid, username, avatar, lastActive: 0 };
}

/** An HF image URL as the path Convo uses for avatars ("uploads/avatars/…"). */
function sitePath(src: string, origin: string): string {
  try {
    const url = new URL(src, `${origin}/`);
    return url.origin === origin ? url.pathname.slice(1) + url.search : "";
  } catch {
    return "";
  }
}

/**
 * Go where a convo link points, as the click would have. A new tab needs the
 * click's user activation, which a slow chat lookup can outlast; the link then
 * opens in this tab instead of as a popup the browser blocks.
 */
export function followLink(link: HTMLAnchorElement, view: Window | null): void {
  if (!view) return;
  const active =
    (view.navigator as { userActivation?: { isActive: boolean } })
      .userActivation?.isActive ?? true;
  if (link.target === "_blank" && active) {
    view.open(link.href, "_blank", "noopener");
  } else {
    view.location.assign(link.href);
  }
}

/**
 * Take plain left clicks on HF convo links: `open` opens the chat in the dock
 * and resolves false when it can't, and then the link is followed as usual.
 * Ctrl/Cmd/Shift/Alt and middle clicks are left to the browser. Returns a
 * function that stops listening.
 */
export function interceptConvoLinks(
  open: (uid: number) => Promise<boolean>,
  origin: string,
  doc: Document = document,
  follow: (link: HTMLAnchorElement) => void = (link) =>
    followLink(link, doc.defaultView)
): () => void {
  const pending = new Set<number>();
  const onClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const target = event.target as Element | null;
    const link = target?.closest?.<HTMLAnchorElement>("a[href]");
    if (!link || link.closest("#hfx-chat-dock")) return;
    const uid = convoLinkUid(link, origin);
    if (!uid) return;
    event.preventDefault();
    if (pending.has(uid)) return;
    pending.add(uid);
    open(uid)
      .then((opened) => {
        if (!opened) follow(link);
      })
      .catch(() => follow(link))
      .finally(() => pending.delete(uid));
  };
  doc.addEventListener("click", onClick);
  return () => doc.removeEventListener("click", onClick);
}
