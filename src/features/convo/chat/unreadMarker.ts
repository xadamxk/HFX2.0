import { el } from "../../../core/Dom";

/**
 * "New messages" in a chat window: a line above the first message that came
 * while you weren't looking at the window, until you focus or click it, and a
 * button to jump down when messages come while you're scrolled up.
 */

const NEAR_BOTTOM = 60;

export const isNearBottom = (list: HTMLElement): boolean =>
  list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM;

export class UnreadMarker {
  readonly divider: HTMLElement;
  readonly jump: HTMLButtonElement;
  /** The message the line sits above, while it's shown. */
  private anchorKey: string | null = null;

  /** `list`: the scrolling message list, whose lines are inserted before its last child. */
  constructor(private readonly list: HTMLElement) {
    this.divider = el(
      "div",
      { class: "hfx-chat-unread-divider", role: "separator" },
      el("span", {}, "New messages")
    );
    this.jump = el(
      "button",
      { type: "button", class: "hfx-chat-jump", hidden: true },
      "New messages ↓"
    );
    this.jump.addEventListener("click", () => {
      list.scrollTop = list.scrollHeight;
      this.jump.hidden = true;
    });
    list.addEventListener("scroll", () => {
      if (isNearBottom(list)) this.jump.hidden = true;
    });
    list.appendChild(this.jump);
  }

  /**
   * A new message from someone else is shown (`line`). `looking`: you're
   * looking at the window; `atBottom`: the list was at the bottom before it.
   */
  arrived(key: string, line: HTMLElement, looking: boolean, atBottom: boolean) {
    if (!looking && this.anchorKey === null) {
      this.anchorKey = key;
      this.place(line);
    }
    if (!atBottom) this.jump.hidden = false;
  }

  /** You focused or clicked the window: the new messages are seen, so the line goes. */
  looked(): void {
    this.anchorKey = null;
    this.divider.remove();
  }

  /** Put the line back after the messages were redrawn. */
  refresh(lineFor: (key: string) => HTMLElement | undefined): void {
    this.place(this.anchorKey ? lineFor(this.anchorKey) : undefined);
  }

  /** You sent something, or the messages were cleared: drop the line and the jump button. */
  clear(): void {
    this.looked();
    this.jump.hidden = true;
  }

  /** Above the message's group if it starts one, otherwise above the message. */
  private place(line: HTMLElement | undefined): void {
    if (!line?.isConnected) {
      this.anchorKey = null;
      this.divider.remove();
      return;
    }
    const group = line.closest(".hfx-gc-group");
    const first = group?.querySelector(".hfx-gc-line") === line;
    (first && group ? group : line).before(this.divider);
  }
}
