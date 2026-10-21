import { el } from "../../../core/Dom";
import type { ChatUser } from "./ConvoClient";
import { avatarUrl } from "./formatMessage";

/**
 * Mentions in room chats: typing @ opens a list of the room's members, and
 * picking one writes HF's mention syntax, @username@, followed by a space.
 */

const MAX_MATCHES = 8;
// Longer than any HF username: past this, the @ isn't a mention being typed
const MAX_QUERY = 30;

export interface MentionQuery {
  /** Where the @ is. */
  start: number;
  /** What's typed after it, up to the caret. */
  query: string;
}

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

let pickerCount = 0;

/** The member list shown above a compose box while a mention is typed. */
export class MentionPicker {
  readonly root: HTMLElement;
  private readonly id = `hfx-mentions-${++pickerCount}`;
  private mention: MentionQuery | null = null;
  private matches: ChatUser[] = [];
  private active = 0;

  constructor(
    private readonly input: HTMLTextAreaElement,
    /** Who can be mentioned, sorted; read each time the list opens. */
    private readonly candidates: () => ChatUser[],
    private readonly origin: string,
    /** The input's text changed by picking someone. */
    private readonly onInsert: () => void
  ) {
    this.root = el("div", {
      class: "hfx-gc-mentions",
      id: this.id,
      role: "listbox",
      "aria-label": "Mention a member",
      hidden: true,
    });
    input.setAttribute("aria-autocomplete", "list");
    input.addEventListener("input", () => this.update());
    input.addEventListener("click", () => this.update());
    input.addEventListener("keyup", (event) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        this.update();
    });
    input.addEventListener("blur", () => this.close());
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /** Open, filter or close the list for what's at the caret. */
  update(): void {
    const { selectionStart, selectionEnd, value } = this.input;
    this.mention =
      selectionStart === selectionEnd
        ? mentionQuery(value, selectionStart)
        : null;
    this.matches = this.mention
      ? matchMembers(this.candidates(), this.mention.query)
      : [];
    this.active = 0;
    this.render();
  }

  /** Handle a key while the list is open; returns whether it was used. */
  handleKey(event: KeyboardEvent): boolean {
    if (!this.isOpen || event.isComposing) return false;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        const step = event.key === "ArrowDown" ? 1 : -1;
        const count = this.matches.length;
        this.active = (this.active + step + count) % count;
        this.render();
        break;
      }
      case "Enter":
      case "Tab":
        if (event.shiftKey) return false;
        this.pick(this.matches[this.active]);
        break;
      case "Escape":
        event.stopPropagation();
        this.close();
        break;
      default:
        return false;
    }
    event.preventDefault();
    return true;
  }

  close(): void {
    this.mention = null;
    this.matches = [];
    this.render();
  }

  private pick(user: ChatUser): void {
    if (!this.mention) return;
    const result = applyMention(
      this.input.value,
      this.mention,
      this.input.selectionStart,
      user.username
    );
    this.input.value = result.value;
    this.input.focus();
    this.input.setSelectionRange(result.caret, result.caret);
    this.close();
    this.onInsert();
  }

  private render(): void {
    const open = this.matches.length > 0;
    this.root.hidden = !open;
    this.input.setAttribute("aria-expanded", String(open));
    if (!open) {
      this.root.replaceChildren();
      this.input.removeAttribute("aria-controls");
      this.input.removeAttribute("aria-activedescendant");
      return;
    }
    this.input.setAttribute("aria-controls", this.id);
    const rows = this.matches.map((user, index) => {
      const selected = index === this.active;
      const row = el(
        "div",
        {
          class: `hfx-gc-user hfx-gc-mention-option${selected ? " hfx-gc-mention-active" : ""}`,
          id: `${this.id}-${index}`,
          role: "option",
          "aria-selected": String(selected),
        },
        [
          el("img", { src: avatarUrl(user.avatar, this.origin), alt: "" }),
          el(
            "span",
            { class: user.group ? `group${user.group}` : null },
            user.username
          ),
        ]
      );
      // Keep focus (and the caret) in the input
      row.addEventListener("mousedown", (event) => event.preventDefault());
      row.addEventListener("click", () => this.pick(user));
      return row;
    });
    this.root.replaceChildren(...rows);
    this.input.setAttribute(
      "aria-activedescendant",
      `${this.id}-${this.active}`
    );
    rows[this.active].scrollIntoView?.({ block: "nearest" });
  }
}
