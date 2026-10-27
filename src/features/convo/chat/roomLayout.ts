import { el } from "../../../core/Dom";
import { convoNiceTime } from "../common/timestamps";
import type { ChatUser } from "./ConvoClient";
import { avatarUrl, RenderableMessage, renderMessage } from "./formatMessage";

/**
 * The grouped, Discord-style message layout every chat window uses: each
 * sender's messages sit under their avatar, username (in their HF group
 * style) and the time.
 */

// Messages from one sender within this many seconds share a group
export const GROUP_SECONDS = 5 * 60;

/** A sender's group of messages, as built by createMessageGroup. */
export interface MessageGroup {
  uid: number;
  /** The newest message's time, so the next one can tell if it joins. */
  dateline: number;
  root: HTMLElement;
  lines: HTMLElement;
}

/** A group's time: just the time today, otherwise the date too. */
export function groupTime(dateline: number, now = new Date()): string {
  const date = new Date(dateline * 1000);
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return date.toDateString() === now.toDateString()
    ? time
    : `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

/** Whether a message continues the group before it: same sender, within five minutes. */
export function joinsGroup(
  group: Pick<MessageGroup, "uid" | "dateline"> | null,
  message: { uid: number; dateline: number }
): boolean {
  return (
    !!group &&
    group.uid === message.uid &&
    message.dateline - group.dateline <= GROUP_SECONDS
  );
}

/** A username in its HF group style. */
export function userLabel(
  user: ChatUser | undefined,
  uid: number
): HTMLElement {
  return el(
    "span",
    { class: user?.group ? `group${user.group}` : null },
    user?.username ?? `User ${uid}`
  );
}

/**
 * A new group for a message: avatar (linking to their profile), name, time,
 * and the message's line. `name` replaces the plain name, e.g. with a button.
 */
export function createMessageGroup(
  message: { uid: number; dateline: number },
  user: ChatUser | undefined,
  firstLine: HTMLElement,
  origin: string,
  name: HTMLElement = el(
    "span",
    { class: "hfx-gc-name" },
    userLabel(user, message.uid)
  )
): MessageGroup {
  const username = user?.username ?? `User ${message.uid}`;
  const lines = el("div", { class: "hfx-gc-lines" }, firstLine);
  const root = el("div", { class: "hfx-gc-group", "data-uid": message.uid }, [
    el(
      "a",
      {
        class: "hfx-gc-avatar",
        href: `${origin}/member.php?action=profile&uid=${message.uid}`,
        target: "_blank",
        rel: "noopener",
        title: `${username}'s profile`,
      },
      el("img", { src: avatarUrl(user?.avatar ?? "", origin), alt: "" })
    ),
    el("div", { class: "hfx-gc-content" }, [
      el("div", { class: "hfx-gc-meta" }, [
        name,
        el(
          "span",
          { class: "hfx-gc-time", title: convoNiceTime(message.dateline) },
          groupTime(message.dateline)
        ),
      ]),
      lines,
    ]),
  ]);
  return { uid: message.uid, dateline: message.dateline, root, lines };
}

/** One message's line; its full time shows on hover. */
export function createMessageLine(
  message: RenderableMessage & { dateline: number },
  origin: string,
  attrs: Record<string, string | number> = {},
  mention = false
): HTMLElement {
  return el(
    "div",
    {
      class: `hfx-gc-line${mention ? " hfx-gc-mention" : ""}`,
      title: convoNiceTime(message.dateline),
      ...attrs,
    },
    renderMessage(message, origin)
  );
}
