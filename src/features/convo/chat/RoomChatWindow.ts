import { el, ElChild } from "../../../core/Dom";
import type { ChatUser, ConvoStatus } from "./ConvoClient";
import { wasNotDelivered } from "./ConvoClient";
import { avatarUrl, mentionsUser } from "./formatMessage";
import { isCommand, RoomMessage } from "./GlobalRoomClient";
import {
  acceptImages,
  attachButton,
  imageUploadError,
  readBytes,
} from "./images";
import { MentionPicker } from "./mentions";
import {
  createMessageGroup,
  createMessageLine,
  joinsGroup,
  MessageGroup,
  userLabel,
} from "./roomLayout";

export { groupTime } from "./roomLayout";

/**
 * A chat window for a room with many people (the global room, private group
 * convos), laid out like Discord: messages grouped under the sender's avatar,
 * username (in their HF group style) and time. Subclasses add how the room is
 * joined and its people panel (online list or members).
 */

const OWN_TYPING_TIMEOUT = 30000;

/** What a room window reads from and sends through. */
export interface RoomSource {
  readonly me: ChatUser | null;
  readonly users: Map<number, ChatUser>;
  readonly status: ConvoStatus;
  readonly isSending: boolean;
  /** Users typing now: uid → username. */
  readonly typing: Map<number, string>;
  /** Loaded messages, oldest first. */
  readonly messages: RoomMessage[];
  createRequestId(): string;
  send(text: string, requestId: string): Promise<unknown>;
  /** Leave out when the room can't take images. */
  sendImage?(image: ArrayBuffer, requestId: string): Promise<unknown>;
  setTyping(typing: boolean): void;
  /** Events: status(status), messages(added, reset), typing(), error(message). */
  on(event: string, listener: (...args: any[]) => void): unknown;
}

export interface RoomWindowOptions {
  minimized: boolean;
  typingIndicators: boolean;
  /** The window was closed (×). */
  onClose: () => void;
  /** The window was minimized or expanded. */
  onChange: () => void;
  origin?: string;
}

export interface RoomWindowView {
  /** The window's `data-party` value, e.g. "-1" or "g48". */
  partyAttr: string;
  title: string;
  /** The full room on convo.php. */
  href: string;
  icon: () => Node;
  placeholder: string;
  /** A note at the top of the messages, e.g. how much history there is. */
  historyNote?: string;
  /** Shown when an image is pasted into a room that can't take images. */
  noImagesNotice?: string;
  /** Header controls before the ↗ link, e.g. "N online". */
  headerExtras?: HTMLElement[];
  /** Elements at the top of the message list, e.g. "Load older messages". */
  listTop?: ElChild[];
}

/** "Nova is typing…", "Nova and Kestrel are typing…", "Several people are typing…". */
export function typingText(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return "Several people are typing…";
}

export abstract class RoomChatWindow {
  readonly root: HTMLElement;
  minimized: boolean;
  protected readonly origin: string;
  protected readonly status: HTMLElement;
  protected readonly list: HTMLElement;
  /** Covers the messages: the online list or members. */
  protected readonly panel: HTMLElement;
  protected readonly input: HTMLTextAreaElement;
  private readonly pendingBox: HTMLElement;
  private readonly notice: HTMLElement;
  private readonly typing: HTMLElement;
  private readonly mentions: MentionPicker;
  private readonly lines = new Map<string, HTMLElement>();
  private lastGroup: MessageGroup | null = null;
  private pending: { requestId: string; node: HTMLElement }[] = [];
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private ownTypingTimer?: ReturnType<typeof setTimeout>;

  constructor(
    protected readonly source: RoomSource,
    protected readonly options: RoomWindowOptions,
    private readonly view: RoomWindowView
  ) {
    this.origin = options.origin ?? location.origin;
    this.minimized = options.minimized;

    this.status = el("span", { class: "hfx-chat-status" });
    const header = el("div", { class: "hfx-chat-header" }, [
      el("span", { class: "hfx-gc-icon" }, view.icon()),
      el("div", { class: "hfx-chat-title" }, [
        el("a", { href: view.href, title: "Open in Convo" }, view.title),
        this.status,
      ]),
      ...(view.headerExtras ?? []),
      el(
        "a",
        {
          class: "hfx-chat-action",
          href: view.href,
          title: "Open in Convo",
          "aria-label": "Open in Convo",
        },
        "↗"
      ),
      this.action("–", "Minimize", () => this.setMinimized(!this.minimized)),
      this.action("×", "Close", () => options.onClose()),
    ]);
    header.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a, button")) return;
      this.setMinimized(!this.minimized);
    });

    this.pendingBox = el("div", { style: "display: contents" });
    this.list = el(
      "div",
      {
        class: "hfx-chat-messages hfx-gc-messages",
        role: "log",
        "aria-live": "polite",
      },
      [
        ...(view.listTop ?? []),
        view.historyNote &&
          el("div", { class: "hfx-chat-notice" }, view.historyNote),
        this.pendingBox,
      ]
    );
    this.panel = el("div", { class: "hfx-gc-online", hidden: true });
    this.notice = el("div", { class: "hfx-chat-notice", hidden: true });
    this.typing = el("div", {
      class: "hfx-chat-typing",
      "aria-live": "polite",
    });
    this.input = el("textarea", {
      rows: 1,
      placeholder: view.placeholder,
      "aria-label": view.placeholder,
      maxlength: 5000,
    });
    this.mentions = new MentionPicker(
      this.input,
      () => this.mentionCandidates(),
      this.origin,
      () => this.onInputChange()
    );
    this.input.addEventListener("keydown", (event) => {
      if (this.mentions.handleKey(event)) return;
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        this.send();
      }
    });
    this.input.addEventListener("input", () => this.onInputChange());

    this.root = el(
      "section",
      {
        class: `hfx-chat-window hfx-gc-window${this.minimized ? " hfx-chat-minimized" : ""}`,
        "data-party": view.partyAttr,
      },
      [
        header,
        el("div", { class: "hfx-gc-body" }, [this.list, this.panel]),
        this.notice,
        this.typing,
        el("div", { class: "hfx-chat-compose" }, [
          this.mentions.root,
          // Only rooms that take images (not group chats yet)
          this.source.sendImage
            ? attachButton((file) => this.uploadImage(file))
            : null,
          this.input,
        ]),
      ]
    );

    acceptImages(this.root, (file) => this.uploadImage(file));
    this.bindSource();
    // What the source already holds, e.g. a group's messages loaded or
    // received before this window opened
    if (source.messages.length) this.addMessages(source.messages, true);
  }

  focus(): void {
    if (!this.minimized) this.input.focus();
  }

  setMinimized(minimized: boolean): void {
    if (this.minimized === minimized) return;
    this.minimized = minimized;
    this.root.classList.toggle("hfx-chat-minimized", minimized);
    if (minimized) {
      this.stopOwnTyping();
      this.mentions.close();
    }
    this.onMinimizedChange(minimized);
    if (!minimized) this.scrollToBottom();
    this.options.onChange();
  }

  destroy(): void {
    this.stopOwnTyping();
    clearTimeout(this.noticeTimer);
    this.root.remove();
  }

  /** Whether the user is looking at this window right now. */
  isActive(): boolean {
    return (
      !this.minimized &&
      !document.hidden &&
      document.hasFocus() &&
      this.root.contains(document.activeElement)
    );
  }

  // ---- Subclass hooks -------------------------------------------------------

  protected onMinimizedChange(_minimized: boolean): void {}

  /** Who typing @ offers to mention, sorted. None: typing @ shows no list. */
  protected mentionCandidates(): ChatUser[] {
    return [];
  }

  /** A message arrived that wasn't loaded before (not a re-render). */
  protected onNewMessage(_message: RoomMessage, _mentionsMe: boolean): void {}

  protected statusText(status: ConvoStatus): string {
    const text: Record<ConvoStatus, string> = {
      connecting: "Connecting…",
      ready: "",
      disconnected: "Reconnecting…",
      ended: "Disconnected. Reload to rejoin.",
    };
    return text[status];
  }

  // ---- Shared ----------------------------------------------------------------

  protected action(
    label: string,
    title: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = el(
      "button",
      { type: "button", class: "hfx-chat-action", title, "aria-label": title },
      label
    );
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onClick();
    });
    return button;
  }

  private bindSource(): void {
    const source = this.source;
    source.on("status", (status: ConvoStatus) => {
      this.status.textContent = this.minimized ? "" : this.statusText(status);
    });
    source.on("messages", (added: RoomMessage[], reset: boolean) => {
      if (reset) this.clearMessages();
      this.addMessages(added);
    });
    source.on("typing", () => {
      if (!this.options.typingIndicators) return;
      this.typing.textContent = typingText(Array.from(source.typing.values()));
    });
    source.on("error", (message: string) => this.showNotice(message));
  }

  protected clearMessages(): void {
    this.list
      .querySelectorAll(".hfx-gc-group")
      .forEach((group) => group.remove());
    this.lines.clear();
    this.lastGroup = null;
  }

  /**
   * Show newly added messages. New ones go at the bottom, grouped; when older
   * ones arrive (Load older), everything is redrawn and the view kept in place.
   * `existing` messages were there before the window opened: not new arrivals.
   */
  private addMessages(added: RoomMessage[], existing = false): void {
    const fresh = added.filter((message) => !this.lines.has(message.key));
    if (!fresh.length) return;
    const firstMid = this.firstMid();
    const olderArrived =
      firstMid !== undefined && fresh.some((message) => message.mid < firstMid);
    if (olderArrived) {
      const previousHeight = this.list.scrollHeight;
      const previousTop = this.list.scrollTop;
      this.clearMessages();
      this.source.messages.forEach((message) => this.appendLine(message));
      this.trimLines();
      this.list.scrollTop =
        previousTop + (this.list.scrollHeight - previousHeight);
      return;
    }

    const firstBatch = this.lines.size === 0;
    const nearBottom =
      this.list.scrollHeight - this.list.scrollTop - this.list.clientHeight <
      60;
    for (const message of fresh) {
      const line = this.appendLine(message);
      if (!existing)
        this.onNewMessage(message, line.classList.contains("hfx-gc-mention"));
      // The echo of our own send replaces its pending line
      if (message.requestId) {
        this.pending = this.pending.filter((pending) => {
          if (pending.requestId !== message.requestId) return true;
          pending.node.remove();
          return false;
        });
      }
    }
    this.trimLines();
    if (
      firstBatch ||
      nearBottom ||
      fresh.some((message) => message.uid === this.source.me?.uid)
    ) {
      this.scrollToBottom();
    }
  }

  private firstMid(): number | undefined {
    const first = this.list.querySelector<HTMLElement>(".hfx-gc-line");
    const key = first?.dataset.key;
    return this.source.messages.find((message) => message.key === key)?.mid;
  }

  private appendLine(message: RoomMessage): HTMLElement {
    const line = this.renderLine(message);
    this.lines.set(message.key, line);
    const group = this.lastGroup;
    if (group && joinsGroup(group, message)) {
      group.lines.appendChild(line);
      group.dateline = message.dateline;
    } else {
      this.lastGroup = this.renderGroup(message, line);
    }
    return line;
  }

  private renderGroup(
    message: RoomMessage,
    firstLine: HTMLElement
  ): MessageGroup {
    const user = this.source.users.get(message.uid);
    const username = user?.username ?? `User ${message.uid}`;
    const nameButton = el(
      "button",
      { type: "button", class: "hfx-gc-name", title: `Mention ${username}` },
      userLabel(user, message.uid)
    );
    nameButton.addEventListener("click", () => this.insertMention(username));
    const group = createMessageGroup(
      message,
      user,
      firstLine,
      this.origin,
      nameButton
    );
    this.list.insertBefore(group.root, this.pendingBox);
    return group;
  }

  private renderLine(message: RoomMessage): HTMLElement {
    const me = this.source.me;
    const mention =
      me &&
      message.uid !== me.uid &&
      !message.html &&
      mentionsUser(message.text, me, this.origin);
    return createMessageLine(
      message,
      this.origin,
      { "data-key": message.key },
      !!mention
    );
  }

  /** Drop lines the source no longer keeps. */
  private trimLines(): void {
    const kept = new Set(this.source.messages.map((message) => message.key));
    for (const [key, line] of this.lines) {
      if (kept.has(key)) continue;
      const group = line.closest(".hfx-gc-group");
      line.remove();
      this.lines.delete(key);
      if (group && !group.querySelector(".hfx-gc-line")) group.remove();
    }
  }

  /** A people panel: section labels and users, each mentioned on click. */
  protected renderPeople(
    backLabel: string,
    sections: { label?: string; users: ChatUser[] }[]
  ): void {
    const back = el(
      "button",
      { type: "button", class: "hfx-gc-online-back" },
      `← ${backLabel}`
    );
    back.addEventListener("click", () => this.togglePanel(false));
    const rows: HTMLElement[] = [back];
    for (const section of sections) {
      if (section.label)
        rows.push(el("div", { class: "hfx-gc-rank" }, section.label));
      for (const user of section.users) {
        const row = el(
          "button",
          {
            type: "button",
            class: "hfx-gc-user",
            title: `Mention ${user.username}`,
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
        row.addEventListener("click", () => {
          this.togglePanel(false);
          this.insertMention(user.username);
        });
        rows.push(row);
      }
    }
    this.panel.replaceChildren(...rows);
  }

  /** Show or hide the people panel; returns whether it's now open. */
  protected togglePanel(open = this.panel.hidden): boolean {
    this.panel.hidden = !open;
    this.onPanelToggle(open);
    return open;
  }

  protected onPanelToggle(_open: boolean): void {}

  /** HF's mention syntax is @username@. */
  private insertMention(username: string): void {
    const value = this.input.value;
    this.input.value = `${value}${value.trim() ? " " : ""}@${username}@ `;
    this.input.focus();
  }

  private async send(): Promise<void> {
    const text = this.input.value.trim();
    if (!text) return;
    if (isCommand(text)) {
      this.showNotice("Commands like /flip only work on convo.php.");
      return;
    }
    if (this.source.isSending) {
      this.showNotice("Please wait for the pending send to finish.");
      return;
    }
    if (this.source.status !== "ready") {
      this.showNotice(
        `${this.view.title} is disconnected. Your message was not sent.`
      );
      return;
    }
    this.input.value = "";
    this.input.style.height = "";
    this.stopOwnTyping();

    await this.deliver(
      `Sending: ${text}`,
      (requestId) => this.source.send(text, requestId),
      // Never reached the server: put the text back
      () => {
        if (!this.input.value) this.input.value = text;
      }
    );
  }

  /** A pasted or dropped image: HF's checks, then upload it. */
  private async uploadImage(file: File): Promise<void> {
    const sendImage = this.source.sendImage?.bind(this.source);
    if (!sendImage) {
      this.showNotice(this.view.noImagesNotice ?? "Images can't be sent here.");
      return;
    }
    const error = imageUploadError(file);
    if (error) {
      this.showNotice(error);
      return;
    }
    if (this.source.isSending) {
      this.showNotice("Please wait for the pending send to finish.");
      return;
    }
    if (this.source.status !== "ready") {
      this.showNotice(
        `${this.view.title} is disconnected. Your image was not sent.`
      );
      return;
    }
    let image: ArrayBuffer;
    try {
      image = await readBytes(file);
    } catch {
      this.showNotice("Couldn't read the image.");
      return;
    }
    await this.deliver("Sending image…", (requestId) =>
      sendImage(image, requestId)
    );
  }

  /** Show a pending line until the echo or the ack arrives. */
  private async deliver(
    label: string,
    run: (requestId: string) => Promise<unknown>,
    undo?: () => void
  ): Promise<void> {
    const requestId = this.source.createRequestId();
    const node = el("div", { class: "hfx-gc-pending" }, label);
    this.pending.push({ requestId, node });
    this.pendingBox.appendChild(node);
    this.scrollToBottom();
    const clear = () => {
      this.pending = this.pending.filter((pending) => pending.node !== node);
      node.remove();
    };
    try {
      await run(requestId);
      // The echo normally replaced it already
      clear();
    } catch (error: any) {
      const message = String(error?.message || "Message failed.");
      clear();
      // Never sent or refused: put the text back. Unconfirmed: it may be there
      if (wasNotDelivered(error)) undo?.();
      this.showNotice(message);
    }
  }

  private onInputChange(): void {
    this.input.style.height = "";
    this.input.style.height = `${Math.min(this.input.scrollHeight, 110)}px`;
    this.onOwnTyping();
  }

  private onOwnTyping(): void {
    if (!this.options.typingIndicators) return;
    const length = this.input.value.length;
    if (length === 0) {
      this.stopOwnTyping();
    } else if (length > 1 && !this.ownTypingTimer) {
      this.source.setTyping(true);
      this.ownTypingTimer = setTimeout(
        () => this.stopOwnTyping(),
        OWN_TYPING_TIMEOUT
      );
    }
  }

  private stopOwnTyping(): void {
    if (!this.ownTypingTimer) return;
    clearTimeout(this.ownTypingTimer);
    this.ownTypingTimer = undefined;
    this.source.setTyping(false);
  }

  protected showNotice(text: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.textContent = text;
    this.notice.hidden = false;
    this.noticeTimer = setTimeout(() => {
      this.notice.hidden = true;
    }, 6000);
  }

  protected scrollToBottom(): void {
    this.list.scrollTop = this.list.scrollHeight;
  }
}
