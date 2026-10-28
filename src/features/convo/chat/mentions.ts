import { el } from "../../../core/Dom";
import type { ChatUser } from "./ConvoClient";
import { avatarUrl } from "./formatMessage";
import { SuggestionPicker, Token } from "./suggestions";

/**
 * Mentions in room chats: typing @ opens a list of the room's members, and
 * picking one writes HF's mention syntax, @username@, followed by a space.
 */

const MAX_MATCHES = 8;
// Longer than any HF username: past this, the @ isn't a mention being typed
const MAX_QUERY = 30;

/** A mention being typed: where the @ is and what follows it. */
export type MentionQuery = Token;

/**
 * The mention being typed at the caret, if any: an @ at the start or after
 * whitespace, with no line break between it and the caret. A finished mention
 * (@name@) doesn't count, since its closing @ follows a name, not a space.
 */
export function mentionQuery(
  value: string,
  caret: number
): MentionQuery | null {
  const before = value.slice(0, caret);
  const start = before.lastIndexOf("@");
  if (start < 0) return null;
  if (start > 0 && !/\s/.test(before[start - 1])) return null;
  const query = before.slice(start + 1);
  if (query.length > MAX_QUERY || /[\r\n]/.test(query)) return null;
  return { start, query };
}

/** Users whose name starts with the query first, then those containing it. */
export function matchMembers(
  users: ChatUser[],
  query: string,
  limit = MAX_MATCHES
): ChatUser[] {
  if (/^\s/.test(query)) return [];
  const needle = query.toLowerCase();
  const starts: ChatUser[] = [];
  const contains: ChatUser[] = [];
  for (const user of users) {
    const name = user.username.toLowerCase();
    if (name.startsWith(needle)) starts.push(user);
    else if (needle && name.includes(needle)) contains.push(user);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Replace the typed @query with @username@ and a space; returns the new caret too. */
export function applyMention(
  value: string,
  mention: MentionQuery,
  caret: number,
  username: string
): { value: string; caret: number } {
  const before = value.slice(0, mention.start);
  const after = value.slice(caret);
  const text = `@${username}@`;
  const space = /^\s/.test(after) ? "" : " ";
  return {
    value: `${before}${text}${space}${after}`,
    caret: before.length + text.length + 1,
  };
}

/** The member list shown above a compose box while a mention is typed. */
export class MentionPicker extends SuggestionPicker<ChatUser> {
  constructor(
    input: HTMLTextAreaElement,
    /** Who can be mentioned, sorted; read each time the list opens. */
    candidates: () => ChatUser[],
    origin: string,
    /** The input's text changed by picking someone. */
    onInsert: () => void
  ) {
    super(
      input,
      {
        label: "Mention a member",
        optionClass: "hfx-gc-user hfx-gc-mention-option",
        find: mentionQuery,
        match: (query) => matchMembers(candidates(), query),
        apply: (value, token, caret, user) =>
          applyMention(value, token, caret, user.username),
        render: (user) => [
          el("img", { src: avatarUrl(user.avatar, origin), alt: "" }),
          el(
            "span",
            { class: user.group ? `group${user.group}` : null },
            user.username
          ),
        ],
      },
      onInsert
    );
  }
}
