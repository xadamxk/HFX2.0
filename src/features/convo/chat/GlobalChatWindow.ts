import { el } from "../../../core/Dom";
import { convoNiceTime } from "../common/timestamps";
import type { ConvoStatus } from "./ConvoClient";
import { avatarUrl, renderMessage } from "./formatMessage";
import { acceptImages, imageUploadError, readBytes } from "./images";
import {
  GLOBAL_PARTY,
  GlobalRoomClient,
  isCommand,
  RANK_NAMES,
  RoomMessage,
} from "./GlobalRoomClient";

/**
 * The global (public) room's chat window, laid out like Discord: messages
 * grouped under the sender's avatar, username (in their HF group style) and
 * time. Its socket is only connected while the window is open and expanded,
 * so the user only shows in the room's online list while they're looking.
 */

// Messages from one sender within this many seconds share a group
const GROUP_SECONDS = 5 * 60;
const OWN_TYPING_TIMEOUT = 30000;

export interface GlobalChatWindowOptions {
  postKey: string;
  minimized: boolean;
  typingIndicators: boolean;
  /** The window was closed (×). */
  onClose: () => void;
  /** The window was minimized or expanded. */
  onChange: () => void;
  origin?: string;
  createClient?: () => GlobalRoomClient;
}

interface Group {
  uid: number;
  dateline: number;
  lines: HTMLElement;
}

export const GLOBE_ICON = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("aria-hidden", "true");
  for (const d of [
    "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z",
    "M3.6 9h16.8M3.6 15h16.8",
    "M12 3c-2.5 2.6-3.6 5.6-3.6 9s1.1 6.4 3.6 9c2.5-2.6 3.6-5.6 3.6-9S14.5 5.6 12 3z",
  ]) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
};

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

/** "Nova is typing…", "Nova and Kestrel are typing…", "Several people are typing…". */
export function typingText(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return "Several people are typing…";
}

export class GlobalChatWindow {
  readonly partyId = GLOBAL_PARTY;
  readonly root: HTMLElement;
  minimized: boolean;
  readonly client: GlobalRoomClient;
  private readonly origin: string;
  private readonly status: HTMLElement;
  private readonly onlineButton: HTMLButtonElement;
  private readonly list: HTMLElement;
  private readonly pendingBox: HTMLElement;
  private readonly online: HTMLElement;
  private readonly notice: HTMLElement;
  private readonly typing: HTMLElement;
  private readonly input: HTMLTextAreaElement;
  private readonly lines = new Map<string, HTMLElement>();
  private lastGroup: Group | null = null;
  private pending: { requestId: string; node: HTMLElement }[] = [];
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private ownTypingTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly options: GlobalChatWindowOptions) {
    this.origin = options.origin ?? location.origin;
    this.minimized = options.minimized;
    this.client =
      options.createClient?.() ??
      new GlobalRoomClient({ postKey: options.postKey, origin: this.origin });

    const action = (label: string, title: string, onClick: () => void) => {
      const button = el(
        "button",
        {
          type: "button",
          class: "hfx-chat-action",
          title,
          "aria-label": title,
        },
        label
      );
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        onClick();
      });
      return button;
    };

    this.status = el("span", { class: "hfx-chat-status" });
    this.onlineButton = el(
      "button",
      {
        type: "button",
        class: "hfx-gc-online-toggle",
        title: "Who's here",
        "aria-expanded": "false",
        hidden: true,
      },
      "0 online"
    );
    this.onlineButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggleOnline();
    });
    const header = el("div", { class: "hfx-chat-header" }, [
      el("span", { class: "hfx-gc-icon" }, GLOBE_ICON()),
      el("div", { class: "hfx-chat-title" }, [
        el(
          "a",
          {
            href: `${this.origin}/convo.php?action=all`,
            title: "Open in Convo",
          },
          "Global chat"
        ),
        this.status,
      ]),
      this.onlineButton,
      el(
        "a",
        {
          class: "hfx-chat-action",
          href: `${this.origin}/convo.php?action=all`,
          title: "Open in Convo",
          "aria-label": "Open in Convo",
        },
        "↗"
      ),
      action("–", "Minimize", () => this.setMinimized(!this.minimized)),
      action("×", "Close", () => options.onClose()),
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
        el(
          "div",
          { class: "hfx-chat-notice" },
          "Recent messages since the room last restarted"
        ),
        this.pendingBox,
      ]
    );
    this.online = el("div", { class: "hfx-gc-online", hidden: true });
    this.notice = el("div", { class: "hfx-chat-notice", hidden: true });
    this.typing = el("div", {
      class: "hfx-chat-typing",
      "aria-live": "polite",
    });
    this.input = el("textarea", {
      rows: 1,
      placeholder: "Message global chat",
      "aria-label": "Message global chat",
      maxlength: 5000,
    });
    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        this.send();
      }
    });
    this.input.addEventListener("input", () => {
      this.input.style.height = "";
      this.input.style.height = `${Math.min(this.input.scrollHeight, 110)}px`;
      this.onOwnTyping();
    });

    this.root = el(
      "section",
      {
        class: `hfx-chat-window hfx-gc-window${this.minimized ? " hfx-chat-minimized" : ""}`,
        "data-party": GLOBAL_PARTY,
      },
      [
        header,
        el("div", { class: "hfx-gc-body" }, [this.list, this.online]),
        this.notice,
        this.typing,
        el("div", { class: "hfx-chat-compose" }, this.input),
      ]
    );

    acceptImages(this.root, (file) => this.uploadImage(file));
    this.bindClient();
    if (!this.minimized) this.client.connect();
  }

  focus(): void {
    if (!this.minimized) this.input.focus();
  }

  /** Minimizing leaves the room; expanding rejoins it. */
  setMinimized(minimized: boolean): void {
    if (this.minimized === minimized) return;
    this.minimized = minimized;
    this.root.classList.toggle("hfx-chat-minimized", minimized);
    if (minimized) {
      this.stopOwnTyping();
      this.client.disconnect();
    } else {
      this.client.connect();
      this.scrollToBottom();
    }
    this.options.onChange();
  }

  destroy(): void {
    this.stopOwnTyping();
    clearTimeout(this.noticeTimer);
    this.client.disconnect();
    this.root.remove();
  }

  private bindClient(): void {
    const client = this.client;
    client.on("status", (status) => this.onStatus(status));
    client.on("messages", (added, reset) => {
      if (reset) this.clearMessages();
      this.appendMessages(added);
    });
    client.on("online", () => {
      this.onlineButton.hidden = false;
      this.onlineButton.textContent = `${client.onlineCount} online`;
      if (!this.online.hidden) this.renderOnline();
    });
    client.on("typing", () => {
      if (!this.options.typingIndicators) return;
      this.typing.textContent = typingText(Array.from(client.typing.values()));
    });
    client.on("error", (message) => this.showNotice(message));
  }

  private onStatus(status: ConvoStatus): void {
    const text: Record<ConvoStatus, string> = {
      connecting: "Joining…",
      ready: "",
      disconnected: "Reconnecting…",
      ended: "Disconnected. Reload to rejoin.",
    };
    // Expected when minimized: the socket is closed on purpose
    this.status.textContent = this.minimized ? "" : text[status];
    if (status !== "ready") this.onlineButton.hidden = true;
  }

  private clearMessages(): void {
    this.list
      .querySelectorAll(".hfx-gc-group")
      .forEach((group) => group.remove());
    this.lines.clear();
    this.lastGroup = null;
  }

  /** Add new messages at the bottom, grouped Discord-style. */
  private appendMessages(added: RoomMessage[]): void {
    const nearBottom =
      this.list.scrollHeight - this.list.scrollTop - this.list.clientHeight <
      60;
    for (const message of added) {
      if (this.lines.has(message.key)) continue;
      const line = this.renderLine(message);
      this.lines.set(message.key, line);
      const group = this.lastGroup;
      if (
        group &&
        group.uid === message.uid &&
        message.dateline - group.dateline <= GROUP_SECONDS
      ) {
        group.lines.appendChild(line);
        group.dateline = message.dateline;
      } else {
        this.lastGroup = this.renderGroup(message, line);
      }
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
      nearBottom ||
      added.some((message) => message.uid === this.client.me?.uid)
    ) {
      this.scrollToBottom();
    }
  }

  private renderGroup(message: RoomMessage, firstLine: HTMLElement): Group {
    const user = this.client.users.get(message.uid);
    const username = user?.username ?? `User ${message.uid}`;
    const nameButton = el(
      "button",
      { type: "button", class: "hfx-gc-name", title: `Mention ${username}` },
      el("span", { class: user?.group ? `group${user.group}` : null }, username)
    );
    nameButton.addEventListener("click", () => this.insertMention(username));
    const lines = el("div", { class: "hfx-gc-lines" }, firstLine);
    const group = el(
      "div",
      { class: "hfx-gc-group", "data-uid": message.uid },
      [
        el(
          "a",
          {
            class: "hfx-gc-avatar",
            href: `${this.origin}/member.php?action=profile&uid=${message.uid}`,
            target: "_blank",
            rel: "noopener",
            title: `${username}'s profile`,
          },
          el("img", {
            src: avatarUrl(user?.avatar ?? "", this.origin),
            alt: "",
          })
        ),
        el("div", { class: "hfx-gc-content" }, [
          el("div", { class: "hfx-gc-meta" }, [
            nameButton,
            el(
              "span",
              { class: "hfx-gc-time", title: convoNiceTime(message.dateline) },
              groupTime(message.dateline)
            ),
          ]),
          lines,
        ]),
      ]
    );
    this.list.insertBefore(group, this.pendingBox);
    return { uid: message.uid, dateline: message.dateline, lines };
  }

  private renderLine(message: RoomMessage): HTMLElement {
    const me = this.client.me;
    const mention =
      me &&
      message.uid !== me.uid &&
      message.text.toLowerCase().includes(`@${me.username.toLowerCase()}@`);
    return el(
      "div",
      {
        class: `hfx-gc-line${mention ? " hfx-gc-mention" : ""}`,
        title: convoNiceTime(message.dateline),
        "data-key": message.key,
      },
      renderMessage(message)
    );
  }

  /** Drop the oldest lines once the client has dropped them. */
  private trimLines(): void {
    const kept = new Set(this.client.messages.map((message) => message.key));
    for (const [key, line] of this.lines) {
      if (kept.has(key)) continue;
      const group = line.closest(".hfx-gc-group");
      line.remove();
      this.lines.delete(key);
      if (group && !group.querySelector(".hfx-gc-line")) group.remove();
    }
  }

  private toggleOnline(): void {
    const open = this.online.hidden;
    this.online.hidden = !open;
    this.onlineButton.setAttribute("aria-expanded", String(open));
    if (open) this.renderOnline();
  }

  /** Who's in the room, in HF's rank sections. */
  private renderOnline(): void {
    const back = el(
      "button",
      { type: "button", class: "hfx-gc-online-back" },
      `← ${this.client.onlineCount} online`
    );
    back.addEventListener("click", () => this.toggleOnline());
    const rows: HTMLElement[] = [back];
    let rank = 0;
    for (const user of this.client.online) {
      if (user.rank !== rank) {
        rank = user.rank;
        rows.push(
          el("div", { class: "hfx-gc-rank" }, RANK_NAMES[rank] ?? "Other")
        );
      }
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
        this.toggleOnline();
        this.insertMention(user.username);
      });
      rows.push(row);
    }
    this.online.replaceChildren(...rows);
  }

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
    if (this.client.isSending) {
      this.showNotice("Please wait for the pending send to finish.");
      return;
    }
    if (this.client.status !== "ready") {
      this.showNotice(
        "Global chat is disconnected. Your message was not sent."
      );
      return;
    }
    this.input.value = "";
    this.input.style.height = "";
    this.stopOwnTyping();

    await this.deliver(
      `Sending: ${text}`,
      (requestId) => this.client.send(text, requestId),
      // Never reached the server: put the text back
      () => {
        if (!this.input.value) this.input.value = text;
      }
    );
  }

  /** A pasted or dropped image: HF's checks, then upload it to the room. */
  private async uploadImage(file: File): Promise<void> {
    const error = imageUploadError(file);
    if (error) {
      this.showNotice(error);
      return;
    }
    if (this.client.isSending) {
      this.showNotice("Please wait for the pending send to finish.");
      return;
    }
    if (this.client.status !== "ready") {
      this.showNotice("Global chat is disconnected. Your image was not sent.");
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
      this.client.sendImage(image, requestId)
    );
  }

  /** Show a pending line until the echo or the ack arrives. */
  private async deliver(
    label: string,
    run: (requestId: string) => Promise<void>,
    undo?: () => void
  ): Promise<void> {
    const requestId = this.client.createRequestId();
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
      if (/not sent|pending send|empty/i.test(message)) undo?.();
      this.showNotice(message);
    }
  }

  private onOwnTyping(): void {
    if (!this.options.typingIndicators) return;
    const length = this.input.value.length;
    if (length === 0) {
      this.stopOwnTyping();
    } else if (length > 1 && !this.ownTypingTimer) {
      this.client.setTyping(true);
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
    this.client.setTyping(false);
  }

  private showNotice(text: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.textContent = text;
    this.notice.hidden = false;
    this.noticeTimer = setTimeout(() => {
      this.notice.hidden = true;
    }, 6000);
  }

  private scrollToBottom(): void {
    this.list.scrollTop = this.list.scrollHeight;
  }
}
