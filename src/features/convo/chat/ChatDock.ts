import { appendChildren, el } from "../../../core/Dom";
import type {
  ChatMessage,
  Conversation,
  ConvoClient,
  ConvoStatus,
} from "./ConvoClient";
import { HISTORY_PAGE_SIZE, presence, Presence } from "./ConvoClient";
import { avatarUrl, previewText, renderMessage } from "./formatMessage";
import {
  convoNiceTime,
  createTimestamp,
  showsTimestamp,
} from "../common/timestamps";

/**
 * Facebook-style chat UI: a column of avatar bubbles (bottom right) for recent
 * and unread conversations, and small chat windows docked beside them.
 */

export interface OpenChat {
  partyId: number;
  minimized: boolean;
}

/** Which chats are open, kept per browser so they survive page navigation. */
export interface DockState {
  open: OpenChat[];
  collapsed: boolean;
}

export const DEFAULT_DOCK_STATE: DockState = { open: [], collapsed: false };

/** Messenger-style short age of a message: now, 5m, 3h, 2d, 4w, 1y. */
export function shortTime(
  dateline: number,
  now = Math.floor(Date.now() / 1000)
): string {
  const seconds = Math.max(0, now - dateline);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 365)}y`;
}

export interface ChatDockOptions {
  client: ConvoClient;
  maxBubbles: number;
  typingIndicators: boolean;
  /** Show timestamps under messages, as Message Timestamps does on convo.php. */
  timestamps: boolean;
  /** Which side of the page the dock sits on (default right). */
  side?: "left" | "right";
  /** Avatar bubbles (default) or a Messenger-style conversation list. */
  layout?: "bubbles" | "list";
  state: DockState;
  saveState: (state: DockState) => void;
  /** Called once if Convo ends the session or the API looks different. */
  onEnded?: (reason?: string) => void;
  origin?: string;
}

interface PendingSend {
  text: string;
  requestId: string;
  failed?: string;
}

interface ChatWindow {
  partyId: number;
  minimized: boolean;
  root: HTMLElement;
  header: HTMLElement;
  avatar: HTMLImageElement;
  name: HTMLAnchorElement;
  status: HTMLElement;
  list: HTMLElement;
  older: HTMLButtonElement;
  notice: HTMLElement;
  pendingBox: HTMLElement;
  typing: HTMLElement;
  input: HTMLTextAreaElement;
  rendered: Map<number, HTMLElement>;
  timestamps: Map<number, HTMLElement>;
  pending: PendingSend[];
  loaded: boolean;
  loading: boolean;
  hasOlder: boolean;
  ownTypingTimer?: ReturnType<typeof setTimeout>;
  noticeTimer?: ReturnType<typeof setTimeout>;
}

const TYPING_TIMEOUT = 35000;
const OWN_TYPING_TIMEOUT = 30000;
const UNCONFIRMED_RETRY =
  "Delivery of this message is unconfirmed. Check the conversation first: sending it again may create a duplicate.\n\nSend it again?";

/**
 * Discord-style status dot for the avatar's top-right corner. While the user
 * types it stretches into a pill with animated dots, in the same color.
 */
function statusDot(status: Presence, typing: boolean): HTMLElement {
  return el(
    "span",
    {
      class: `hfx-chat-dot hfx-chat-presence-${status}${typing ? " hfx-chat-dot-typing" : ""}`,
      "aria-hidden": "true",
    },
    typing ? [el("i"), el("i"), el("i")] : null
  );
}

const CHAT_ICON = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(ns, "path");
  path.setAttribute(
    "d",
    "M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4 21l4.1-1.9c1.2.4 2.5.6 3.9.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"
  );
  svg.appendChild(path);
  return svg;
};

export class ChatDock {
  readonly root: HTMLElement;
  private readonly heads: HTMLElement;
  private readonly windows = new Map<number, ChatWindow>();
  private readonly client: ConvoClient;
  private readonly origin: string;
  private state: DockState;
  private inboxLoaded = false;
  private restored = false;
  private ended = false;
  private lastActive = 0;
  /** Users typing right now, with the timer that expires their notice. */
  private readonly typingUsers = new Map<
    number,
    ReturnType<typeof setTimeout>
  >();
  private presenceTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly options: ChatDockOptions) {
    this.client = options.client;
    this.origin = options.origin ?? location.origin;
    this.state = {
      open: (options.state?.open ?? []).filter(
        (chat) => Number(chat?.partyId) > 0
      ),
      collapsed: Boolean(options.state?.collapsed),
    };
    this.heads = el("div", {
      class: options.layout === "list" ? "hfx-chat-list" : "hfx-chat-heads",
    });
    this.root = el(
      "div",
      {
        id: "hfx-chat-dock",
        class: options.side === "left" ? "hfx-chat-left" : null,
        hidden: true,
      },
      this.heads
    );
    this.bindClient();
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.root);
    // Statuses come from last-active times, so they age (online → away → offline)
    this.presenceTimer = setInterval(() => this.renderHeads(), 60000);
  }

  destroy(): void {
    clearInterval(this.presenceTimer);
    this.typingUsers.forEach((timer) => clearTimeout(timer));
    this.typingUsers.clear();
    this.root.remove();
    this.windows.clear();
  }

  private bindClient(): void {
    const client = this.client;
    client.on("status", (status, reason) => this.onStatus(status, reason));
    client.on("conversations", () => {
      this.inboxLoaded = true;
      this.renderHeads();
      this.windows.forEach((win) => this.renderHeader(win));
    });
    client.on("messages", (partyId, live) => {
      if (live) {
        // A message from them ends their typing notice
        const last = client.getMessages(partyId).slice(-1)[0];
        if (last && last.uid !== client.me?.uid) {
          this.setUserTyping(last.uid, false);
        }
      }
      const win = this.windows.get(partyId);
      if (!win) return;
      this.renderMessages(win);
      if (live && this.isActive(win)) client.markRead(partyId);
    });
    client.on("typing", (uid, typing) => {
      if (this.options.typingIndicators) this.setUserTyping(uid, typing);
    });
    client.on("error", (message) => {
      const win =
        this.windows.get(this.lastActive) ?? this.windows.values().next().value;
      if (win) this.showNotice(win, message);
    });
  }

  private onStatus(status: ConvoStatus, reason?: string): void {
    if (status === "ended") {
      if (this.ended) return;
      this.ended = true;
      this.destroy();
      this.options.onEnded?.(reason);
      return;
    }
    const text =
      status === "ready"
        ? ""
        : status === "connecting"
          ? "Connecting…"
          : "Reconnecting…";
    this.windows.forEach((win) => {
      win.status.textContent = text;
    });
    if (status !== "ready") return;

    if (!this.restored) {
      this.restored = true;
      // Oldest first, so the newest ends up next to the bubbles
      [...this.state.open].reverse().forEach((chat) =>
        this.openChat(chat.partyId, {
          minimized: chat.minimized,
          restore: true,
        })
      );
    } else {
      // Catch up on what was missed while disconnected
      this.windows.forEach((win) => {
        if (win.loaded)
          this.client.loadHistory(win.partyId).catch(() => undefined);
      });
    }
  }

  // ---- Bubbles -------------------------------------------------------------

  /** Recent conversations, always including unread and open ones, newest first. */
  private visibleConversations(limit: number): Conversation[] {
    const all = this.client.getConversations();
    const max = Math.max(
      1,
      Math.min(limit, Math.round(this.options.maxBubbles) || 5)
    );
    const picked = new Set<Conversation>();
    for (const conversation of all) {
      if (picked.size >= max) break;
      if (conversation.unread > 0 || this.windows.has(conversation.partyId)) {
        picked.add(conversation);
      }
    }
    for (const conversation of all) {
      if (picked.size >= max) break;
      picked.add(conversation);
    }
    return all.filter((conversation) => picked.has(conversation));
  }

  /** Render the bubbles or the list, whichever layout is configured. */
  private renderHeads(): void {
    if (this.ended) return;
    const conversations =
      this.options.layout === "list" ? this.renderList() : this.renderBubbles();
    this.root.hidden =
      !this.inboxLoaded ||
      (conversations.length === 0 && this.windows.size === 0);
  }

  /** Conversations with unread messages, for the launcher and list header. */
  private unreadCount(): number {
    return this.client
      .getConversations()
      .filter((conversation) => conversation.unread > 0).length;
  }

  private toggleCollapsed(): void {
    this.state.collapsed = !this.state.collapsed;
    this.save();
    this.renderHeads();
  }

  private renderBubbles(): Conversation[] {
    const conversations = this.visibleConversations(10);
    const totalUnread = this.unreadCount();

    const launcher = el(
      "button",
      {
        type: "button",
        class: "hfx-chat-launcher",
        title: this.state.collapsed ? "Show Convo chats" : "Hide Convo chats",
        "aria-expanded": String(!this.state.collapsed),
      },
      [
        CHAT_ICON(),
        totalUnread > 0 && el("span", { class: "hfx-chat-badge" }, totalUnread),
      ]
    );
    launcher.addEventListener("click", () => this.toggleCollapsed());

    const heads = this.state.collapsed
      ? []
      : conversations.map((conversation) => {
          const { other } = conversation;
          const preview = previewText(conversation.lastMessage);
          const status = presence(other.lastActive);
          const typing = this.typingUsers.has(other.uid);
          const head = el(
            "button",
            {
              type: "button",
              class: [
                "hfx-chat-head",
                this.windows.has(conversation.partyId) && "hfx-chat-head-open",
              ]
                .filter(Boolean)
                .join(" "),
              title: [
                `${other.username} (${status})`,
                typing ? "typing…" : preview,
              ]
                .filter(Boolean)
                .join(": "),
              "aria-label": `Chat with ${other.username}, ${status}${typing ? ", typing" : ""}`,
              "data-party": conversation.partyId,
              "data-presence": status,
            },
            [
              el("img", {
                src: avatarUrl(other.avatar, this.origin),
                alt: "",
              }),
              statusDot(status, typing),
              conversation.unread > 0 &&
                el(
                  "span",
                  { class: "hfx-chat-badge" },
                  conversation.unread > 9 ? "9+" : conversation.unread
                ),
            ]
          );
          head.addEventListener("click", () =>
            this.openChat(conversation.partyId, { focus: true })
          );
          return head;
        });

    this.heads.replaceChildren(launcher, ...heads);
    return conversations;
  }

  /**
   * Messenger-style list: a "Chats" panel docked at the bottom edge, with a
   * row per conversation (avatar, name, time, last message or typing).
   */
  private renderList(): Conversation[] {
    const conversations = this.visibleConversations(20);
    const totalUnread = this.unreadCount();
    const now = Math.floor(Date.now() / 1000);

    const header = el(
      "button",
      {
        type: "button",
        class: "hfx-chat-list-header",
        title: this.state.collapsed ? "Show Convo chats" : "Hide Convo chats",
        "aria-expanded": String(!this.state.collapsed),
      },
      [
        CHAT_ICON(),
        el("span", { class: "hfx-chat-list-title" }, "Chats"),
        totalUnread > 0 && el("span", { class: "hfx-chat-badge" }, totalUnread),
        el(
          "span",
          { class: "hfx-chat-list-chevron", "aria-hidden": "true" },
          this.state.collapsed ? "▴" : "▾"
        ),
      ]
    );
    header.addEventListener("click", () => this.toggleCollapsed());

    const rows = conversations.map((conversation) => {
      const { other, lastMessage } = conversation;
      const status = presence(other.lastActive);
      const typing = this.typingUsers.has(other.uid);
      const unread = conversation.unread > 0;
      const mine = lastMessage && lastMessage.uid === this.client.me?.uid;
      // The avatar's dot animates while they type; the preview says so too
      const preview = typing
        ? "typing…"
        : [mine && "You: ", previewText(lastMessage)];

      const row = el(
        "button",
        {
          type: "button",
          class: [
            "hfx-chat-row",
            unread && "hfx-chat-row-unread",
            this.windows.has(conversation.partyId) && "hfx-chat-row-open",
          ]
            .filter(Boolean)
            .join(" "),
          title: `${other.username} (${status})`,
          "data-party": conversation.partyId,
          "data-presence": status,
        },
        [
          el("span", { class: "hfx-chat-row-avatar" }, [
            el("img", { src: avatarUrl(other.avatar, this.origin), alt: "" }),
            statusDot(status, typing),
          ]),
          el("span", { class: "hfx-chat-row-body" }, [
            el("span", { class: "hfx-chat-row-top" }, [
              el("span", { class: "hfx-chat-row-name" }, other.username),
              conversation.dateline > 0 &&
                el(
                  "span",
                  {
                    class: "hfx-chat-row-time",
                    title: convoNiceTime(conversation.dateline),
                  },
                  shortTime(conversation.dateline, now)
                ),
            ]),
            el("span", { class: "hfx-chat-row-preview" }, preview),
          ]),
          unread &&
            el(
              "span",
              { class: "hfx-chat-badge hfx-chat-row-badge" },
              conversation.unread > 9 ? "9+" : conversation.unread
            ),
        ]
      );
      row.addEventListener("click", () =>
        this.openChat(conversation.partyId, { focus: true })
      );
      return el("li", null, row);
    });

    this.heads.replaceChildren();
    appendChildren(this.heads, [
      header,
      !this.state.collapsed &&
        el(
          "ul",
          { class: "hfx-chat-list-rows", "aria-label": "Convo conversations" },
          rows
        ),
    ]);
    return conversations;
  }

  // ---- Windows -------------------------------------------------------------

  private maxWindows(): number {
    // Leave room for the bubble column or the list panel
    const reserved = this.options.layout === "list" ? 340 : 90;
    return Math.max(
      1,
      Math.min(3, Math.floor((window.innerWidth - reserved) / 330))
    );
  }

  openChat(
    partyId: number,
    { focus = false, minimized = false, restore = false } = {}
  ): void {
    let win = this.windows.get(partyId);
    if (!win) {
      win = this.createWindow(partyId, minimized);
      this.windows.set(partyId, win);
      // The newest window sits next to the bubbles
      this.heads.after(win.root);
      // Close the oldest windows that no longer fit
      const open = Array.from(this.windows.values());
      while (open.length > this.maxWindows())
        this.closeChat(open.shift()!.partyId);
    } else if (!restore) {
      this.setMinimized(win, false);
    }

    if (!win.minimized) this.ensureLoaded(win);
    if (!restore) this.save();
    this.renderHeads();
    if (focus && !win.minimized) {
      win.input.focus();
      this.markReadIfActive(win);
    }
  }

  closeChat(partyId: number): void {
    const win = this.windows.get(partyId);
    if (!win) return;
    this.stopOwnTyping(win);
    clearTimeout(win.noticeTimer);
    win.root.remove();
    this.windows.delete(partyId);
    this.save();
    this.renderHeads();
  }

  private setMinimized(win: ChatWindow, minimized: boolean): void {
    if (win.minimized === minimized) return;
    win.minimized = minimized;
    win.root.classList.toggle("hfx-chat-minimized", minimized);
    if (minimized) {
      this.stopOwnTyping(win);
    } else {
      this.ensureLoaded(win);
      this.scrollToBottom(win);
    }
    this.save();
  }

  private createWindow(partyId: number, minimized: boolean): ChatWindow {
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

    const avatar = el("img", { src: avatarUrl("", this.origin), alt: "" });
    const name = el(
      "a",
      { href: `${this.origin}/convo.php?id=${partyId}` },
      "Convo"
    );
    const status = el("span", { class: "hfx-chat-status" });
    const fullLink = el(
      "a",
      {
        class: "hfx-chat-action",
        href: `${this.origin}/convo.php?id=${partyId}`,
        title: "Open in Convo",
        "aria-label": "Open in Convo",
      },
      "↗"
    );
    const header = el("div", { class: "hfx-chat-header" }, [
      avatar,
      el("div", { class: "hfx-chat-title" }, [name, status]),
      fullLink,
    ]);
    const older = el(
      "button",
      { type: "button", class: "hfx-chat-older", hidden: true },
      "Load older messages"
    );
    const notice = el("div", { class: "hfx-chat-notice", hidden: true });
    const pendingBox = el("div", { style: "display: contents" });
    const list = el(
      "div",
      { class: "hfx-chat-messages", role: "log", "aria-live": "polite" },
      [older, pendingBox]
    );
    const typing = el("div", {
      class: "hfx-chat-typing",
      "aria-live": "polite",
    });
    const input = el("textarea", {
      rows: 1,
      placeholder: "Aa",
      "aria-label": "Message",
      maxlength: 5000,
    });
    const root = el(
      "section",
      {
        class: `hfx-chat-window${minimized ? " hfx-chat-minimized" : ""}`,
        "data-party": partyId,
      },
      [
        header,
        list,
        notice,
        typing,
        el("div", { class: "hfx-chat-compose" }, input),
      ]
    );

    const win: ChatWindow = {
      partyId,
      minimized,
      root,
      header,
      avatar,
      name,
      status,
      list,
      older,
      notice,
      pendingBox,
      typing,
      input,
      rendered: new Map(),
      timestamps: new Map(),
      pending: [],
      loaded: false,
      loading: false,
      hasOlder: false,
    };

    header.append(
      action("–", "Minimize", () => this.setMinimized(win, !win.minimized)),
      action("×", "Close", () => this.closeChat(partyId))
    );
    header.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a, button")) return;
      this.setMinimized(win, !win.minimized);
      if (!win.minimized) input.focus();
    });
    root.addEventListener("focusin", () => {
      this.lastActive = partyId;
      this.markReadIfActive(win);
    });
    list.addEventListener("pointerdown", () => {
      this.lastActive = partyId;
      if (document.hasFocus()) this.markRead(win);
    });
    older.addEventListener("click", () => this.loadOlder(win));
    list.addEventListener("scroll", () => {
      if (list.scrollTop < 40 && win.hasOlder && !win.loading && win.loaded)
        this.loadOlder(win);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        this.send(win);
      }
    });
    input.addEventListener("input", () => {
      this.autoGrow(input);
      this.onOwnTyping(win);
    });

    this.renderHeader(win);
    this.renderTyping(win);
    return win;
  }

  private renderHeader(win: ChatWindow): void {
    const conversation = this.client.conversations.get(win.partyId);
    if (conversation) {
      const { other } = conversation;
      win.avatar.src = avatarUrl(other.avatar, this.origin);
      win.name.textContent = other.username;
      win.name.href = `${this.origin}/member.php?action=profile&uid=${other.uid}`;
      win.name.title = `${other.username}'s profile`;
    }
    win.header.classList.toggle(
      "hfx-chat-unread",
      (conversation?.unread ?? 0) > 0
    );
  }

  private async ensureLoaded(win: ChatWindow): Promise<void> {
    if (win.loaded || win.loading) return;
    win.loading = true;
    this.setListNotice(win, "Loading…");
    try {
      await this.client.loadHistory(win.partyId);
      win.loaded = true;
      win.hasOlder =
        this.client.getMessages(win.partyId).length >= HISTORY_PAGE_SIZE;
      this.setListNotice(
        win,
        this.client.getMessages(win.partyId).length ? "" : "No messages yet."
      );
      this.renderMessages(win);
      this.scrollToBottom(win);
      this.markReadIfActive(win);
    } catch {
      this.setListNotice(win, "Couldn't load messages. Click to retry.", () =>
        this.ensureLoaded(win)
      );
    } finally {
      win.loading = false;
    }
  }

  private async loadOlder(win: ChatWindow): Promise<void> {
    if (win.loading || !win.hasOlder) return;
    win.loading = true;
    win.older.disabled = true;
    win.older.textContent = "Loading…";
    try {
      win.hasOlder = await this.client.loadOlder(win.partyId);
    } catch {
      this.showNotice(win, "Couldn't load older messages.");
    } finally {
      win.loading = false;
      win.older.disabled = false;
      win.older.textContent = "Load older messages";
      this.renderMessages(win);
    }
  }

  /** A notice in place of messages (loading, empty, or an error with a retry). */
  private setListNotice(
    win: ChatWindow,
    text: string,
    onClick?: () => void
  ): void {
    win.list.querySelector(".hfx-chat-list-notice")?.remove();
    if (!text) return;
    const notice = el(
      "div",
      { class: "hfx-chat-notice hfx-chat-list-notice" },
      text
    );
    if (onClick) {
      notice.style.cursor = "pointer";
      notice.addEventListener("click", onClick, { once: true });
    }
    win.older.after(notice);
  }

  /** Add newly loaded messages in order, keeping the scroll position sensible. */
  private renderMessages(win: ChatWindow): void {
    const messages = this.client.getMessages(win.partyId);
    const list = win.list;
    const nearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    const previousHeight = list.scrollHeight;
    const firstRendered = Math.min(
      ...Array.from(win.rendered.keys()),
      Infinity
    );
    let addedNewer = false;

    let previous: Element =
      win.list.querySelector(".hfx-chat-list-notice") ?? win.older;
    messages.forEach((message, index) => {
      let node = win.rendered.get(message.mid);
      if (!node) {
        node = this.renderBubble(message);
        win.rendered.set(message.mid, node);
        previous.after(node);
        if (message.mid > firstRendered) addedNewer = true;
      }
      const prior = messages[index - 1];
      node.classList.toggle(
        "hfx-chat-group-start",
        !prior || prior.uid !== message.uid
      );
      previous = node;

      // Timestamps follow their message, and move when a newer message joins its minute
      const timestamp = this.timestampFor(win, message, messages[index + 1]);
      if (timestamp) {
        if (node.nextSibling !== timestamp) node.after(timestamp);
        previous = timestamp;
      }
    });
    if (messages.length) this.setListNotice(win, "");

    // Drop pending sends whose echo has arrived
    const echoed = new Set(
      messages.map((message) => message.requestId).filter(Boolean)
    );
    const before = win.pending.length;
    win.pending = win.pending.filter(
      (pending) => !echoed.has(pending.requestId)
    );
    if (win.pending.length !== before) this.renderPending(win);

    win.older.hidden = !win.loaded || !win.hasOlder;
    if (addedNewer || firstRendered === Infinity) {
      if (nearBottom || firstRendered === Infinity) this.scrollToBottom(win);
    } else {
      // Older messages were added above: keep the view where it was
      list.scrollTop += list.scrollHeight - previousHeight;
    }
  }

  /**
   * The message's timestamp element if it should show one (same rule as
   * Message Timestamps), removing a stale one otherwise.
   */
  private timestampFor(
    win: ChatWindow,
    message: ChatMessage,
    next: ChatMessage | undefined
  ): HTMLElement | null {
    const existing = win.timestamps.get(message.mid);
    const minute = convoNiceTime(message.dateline);
    const nextMinute =
      next && next.uid === message.uid ? convoNiceTime(next.dateline) : null;
    if (!this.options.timestamps || !showsTimestamp(minute, nextMinute)) {
      existing?.remove();
      win.timestamps.delete(message.mid);
      return null;
    }
    if (existing) return existing;
    const timestamp = createTimestamp(minute);
    timestamp.classList.add(
      message.uid === this.client.me?.uid
        ? "hfx-chat-stamp-mine"
        : "hfx-chat-stamp-theirs"
    );
    win.timestamps.set(message.mid, timestamp);
    return timestamp;
  }

  private renderBubble(message: ChatMessage): HTMLElement {
    const mine = message.uid === this.client.me?.uid;
    return el(
      "div",
      {
        class: `hfx-chat-msg ${mine ? "hfx-chat-mine" : "hfx-chat-theirs"}`,
        title: convoNiceTime(message.dateline),
        "data-mid": message.mid,
      },
      renderMessage(message)
    );
  }

  private renderPending(win: ChatWindow): void {
    const nodes = win.pending.flatMap((pending) => {
      const bubble = el(
        "div",
        {
          class: `hfx-chat-msg hfx-chat-mine ${pending.failed ? "hfx-chat-failed" : "hfx-chat-pending"}`,
          title: pending.failed ? "Not confirmed" : "Sending…",
        },
        pending.text
      );
      if (!pending.failed) return [bubble];
      const retry = el("button", { type: "button" }, "Retry");
      retry.addEventListener("click", () => {
        if (!window.confirm(UNCONFIRMED_RETRY)) return;
        win.pending = win.pending.filter((p) => p !== pending);
        this.send(win, pending.text);
      });
      const discard = el("button", { type: "button" }, "Discard");
      discard.addEventListener("click", () => {
        win.pending = win.pending.filter((p) => p !== pending);
        this.renderPending(win);
      });
      return [
        bubble,
        el("div", { class: "hfx-chat-msg-error" }, [
          pending.failed,
          retry,
          discard,
        ]),
      ];
    });
    win.pendingBox.replaceChildren(...nodes);
  }

  private async send(win: ChatWindow, retryText?: string): Promise<void> {
    const text = (retryText ?? win.input.value).trim();
    if (!text) return;
    if (this.client.isSending) {
      this.showNotice(win, "Please wait for the pending send to finish.");
      return;
    }
    if (this.client.status !== "ready") {
      this.showNotice(win, "Convo is disconnected. Your message was not sent.");
      return;
    }
    if (retryText === undefined) {
      win.input.value = "";
      this.autoGrow(win.input);
    }
    this.stopOwnTyping(win);

    const pending: PendingSend = {
      text,
      requestId: this.client.createRequestId(),
    };
    win.pending.push(pending);
    this.renderPending(win);
    this.scrollToBottom(win);

    try {
      await this.client.send(win.partyId, text, pending.requestId);
      const echoed = this.client
        .getMessages(win.partyId)
        .some((message) => message.requestId === pending.requestId);
      win.pending = win.pending.filter((p) => p !== pending);
      this.renderPending(win);
      // The echo normally arrives before the ack; fetch it if it didn't
      if (!echoed) this.client.loadHistory(win.partyId).catch(() => undefined);
    } catch (error: any) {
      const message = String(error?.message || "Message failed.");
      if (/not sent|pending send|empty/i.test(message)) {
        // Never reached the server: put the text back
        win.pending = win.pending.filter((p) => p !== pending);
        if (!win.input.value) win.input.value = text;
        this.showNotice(win, message);
      } else {
        pending.failed = message;
      }
      this.renderPending(win);
    }
  }

  private showNotice(win: ChatWindow, text: string): void {
    clearTimeout(win.noticeTimer);
    win.notice.textContent = text;
    win.notice.hidden = false;
    win.noticeTimer = setTimeout(() => {
      win.notice.hidden = true;
    }, 6000);
  }

  /** Track who's typing; shown in their window and on their bubble. */
  private setUserTyping(uid: number, typing: boolean): void {
    if (!typing && !this.typingUsers.has(uid)) return;
    clearTimeout(this.typingUsers.get(uid));
    this.typingUsers.delete(uid);
    if (typing) {
      // Typing notices can be missed; don't show one forever
      this.typingUsers.set(
        uid,
        setTimeout(() => this.setUserTyping(uid, false), TYPING_TIMEOUT)
      );
    }
    this.windows.forEach((win) => this.renderTyping(win));
    this.renderHeads();
  }

  private renderTyping(win: ChatWindow): void {
    const other = this.client.conversations.get(win.partyId)?.other;
    win.typing.textContent =
      other && this.typingUsers.has(other.uid)
        ? `${other.username} is typing…`
        : "";
  }

  private onOwnTyping(win: ChatWindow): void {
    if (!this.options.typingIndicators) return;
    const length = win.input.value.length;
    if (length === 0) {
      this.stopOwnTyping(win);
    } else if (length > 1 && !win.ownTypingTimer) {
      this.client.setTyping(win.partyId, true);
      win.ownTypingTimer = setTimeout(
        () => this.stopOwnTyping(win),
        OWN_TYPING_TIMEOUT
      );
    }
  }

  private stopOwnTyping(win: ChatWindow): void {
    if (!win.ownTypingTimer) return;
    clearTimeout(win.ownTypingTimer);
    win.ownTypingTimer = undefined;
    this.client.setTyping(win.partyId, false);
  }

  /** Whether the user is looking at this window right now. */
  private isActive(win: ChatWindow): boolean {
    return (
      !win.minimized &&
      !document.hidden &&
      document.hasFocus() &&
      win.root.contains(document.activeElement)
    );
  }

  private markReadIfActive(win: ChatWindow): void {
    if (this.isActive(win)) this.markRead(win);
  }

  private markRead(win: ChatWindow): void {
    if (win.minimized || !win.loaded) return;
    if ((this.client.conversations.get(win.partyId)?.unread ?? 0) > 0) {
      this.client.markRead(win.partyId);
    }
  }

  private scrollToBottom(win: ChatWindow): void {
    win.list.scrollTop = win.list.scrollHeight;
  }

  private autoGrow(input: HTMLTextAreaElement): void {
    input.style.height = "";
    input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
  }

  private save(): void {
    // Newest first, matching the dock order
    const open = Array.from(this.windows.values())
      .reverse()
      .map(({ partyId, minimized }) => ({ partyId, minimized }));
    this.state = { open, collapsed: this.state.collapsed };
    this.options.saveState(this.state);
  }
}
