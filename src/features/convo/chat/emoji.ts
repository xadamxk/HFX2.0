import { el } from "../../../core/Dom";

/**
 * The emoji button beside a chat input: a grid of common emoji, with the ones
 * you used last first. Picking one types it at the caret. Recent emoji are
 * kept in this site's localStorage, for this browser only.
 */

export const EMOJI_SECTIONS: { label: string; emoji: string[] }[] = [
  {
    label: "Smileys",
    emoji: Array.from(
      "😀😃😄😁😆😅😂🤣🙂🙃😉😊😇🥰😍🤩😘😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬😌😔😪😴😷🤒🤕🤢🤮🥵🥶🥴😵🤯🤠🥳😎🤓🧐😕😟🙁😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀💩🤡👻👽🤖"
    ),
  },
  {
    label: "Gestures",
    emoji: Array.from(
      "👍👎👌🤌✌🤞🤟🤘🤙👈👉👆👇☝👋🤚🖐✋👏🙌🤝🙏💪🫡🤷🤦🙋🙈🙉🙊"
    ),
  },
  {
    label: "Hearts & symbols",
    emoji: Array.from(
      "❤🧡💛💚💙💜🖤🤍💔💯💢💥💫💦💤🔥✨⭐🌟⚡✅❌❗❓⚠🚫💬👀🎉🎊"
    ),
  },
  {
    label: "Things",
    emoji: Array.from(
      "💰💵💸💳💎🪙📈📉🏆🥇🎁🎮💻📱🔒🔑🛠⚙📌📎📝📢🔔⏰⌛☕🍺🍻🍕🍔🚀"
    ),
  },
];

const RECENT_KEY = "hfx-chat-emoji-recent";
const RECENT_LIMIT = 16;

export function loadRecentEmoji(store: Storage | null = local()): string[] {
  try {
    const saved = JSON.parse(store?.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(saved)
      ? saved.filter((e): e is string => typeof e === "string")
      : [];
  } catch {
    return [];
  }
}

/** Put an emoji first in the recent list. */
export function rememberEmoji(
  emoji: string,
  store: Storage | null = local()
): void {
  const recent = [emoji, ...loadRecentEmoji(store).filter((e) => e !== emoji)];
  try {
    store?.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, RECENT_LIMIT)));
  } catch {
    // Storage blocked or full: recents just aren't kept
  }
}

function local(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Type text at the caret (replacing any selection), as if typed: listeners see an input event. */
export function insertAtCaret(input: HTMLTextAreaElement, text: string): void {
  const { selectionStart, selectionEnd, value } = input;
  input.value =
    value.slice(0, selectionStart) + text + value.slice(selectionEnd);
  const caret = selectionStart + text.length;
  input.focus();
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

const smileyIcon = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of [
    "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z",
    "M8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8",
    "M9 9.5h.01M15 9.5h.01",
  ]) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
};

export class EmojiPicker {
  readonly button: HTMLButtonElement;
  readonly panel: HTMLElement;
  private readonly onOutside = (event: Event) => {
    const target = event.target as Node;
    if (!this.panel.contains(target) && !this.button.contains(target))
      this.close();
  };

  /**
   * `compose`: the element holding the input, button and panel; Esc there
   * closes an open panel before anything else sees it.
   */
  constructor(
    private readonly input: HTMLTextAreaElement,
    compose: HTMLElement,
    private readonly store: Storage | null = local()
  ) {
    this.button = el(
      "button",
      {
        type: "button",
        class: "hfx-chat-emoji",
        title: "Emoji",
        "aria-label": "Emoji",
        "aria-expanded": "false",
        "aria-haspopup": "dialog",
      },
      smileyIcon()
    );
    this.panel = el("div", {
      class: "hfx-chat-emoji-panel",
      role: "dialog",
      "aria-label": "Emoji",
      hidden: true,
    });
    // Keep focus (and the caret) in the input
    this.button.addEventListener("mousedown", (event) =>
      event.preventDefault()
    );
    this.panel.addEventListener("mousedown", (event) => event.preventDefault());
    this.button.addEventListener("click", () =>
      this.isOpen ? this.close() : this.open()
    );
    compose.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape" || !this.isOpen) return;
        event.preventDefault();
        event.stopPropagation();
        this.close();
      },
      true
    );
    compose.append(this.button, this.panel);
  }

  get isOpen(): boolean {
    return !this.panel.hidden;
  }

  open(): void {
    const recent = loadRecentEmoji(this.store);
    const sections = recent.length
      ? [{ label: "Recent", emoji: recent }, ...EMOJI_SECTIONS]
      : EMOJI_SECTIONS;
    this.panel.replaceChildren(
      ...sections.flatMap(({ label, emoji }) => [
        el("div", { class: "hfx-chat-emoji-label" }, label),
        el(
          "div",
          { class: "hfx-chat-emoji-grid" },
          emoji.map((e) => {
            const option = el(
              "button",
              { type: "button", class: "hfx-chat-emoji-option" },
              e
            );
            option.addEventListener("click", () => this.pick(e));
            return option;
          })
        ),
      ])
    );
    this.panel.hidden = false;
    this.panel.scrollTop = 0;
    this.button.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", this.onOutside, true);
  }

  close(): void {
    if (!this.isOpen) return;
    this.panel.hidden = true;
    this.panel.replaceChildren();
    this.button.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", this.onOutside, true);
  }

  /** Type it and keep the panel open, so several can go in a row. */
  private pick(emoji: string): void {
    rememberEmoji(emoji, this.store);
    insertAtCaret(this.input, emoji);
  }
}
