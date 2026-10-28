import { appendChildren, el, ElChild } from "../../../core/Dom";
import type {
  ChatMessage,
  ChatUser,
  Conversation,
  GroupChat,
  ConvoClient,
  ConvoStatus,
} from "./ConvoClient";
import {
  HISTORY_PAGE_SIZE,
  presence,
  Presence,
  wasNotDelivered,
} from "./ConvoClient";
import { CommandPicker } from "./commandPicker";
import { commandsFor, parseCommand, runCommand, showReply } from "./commands";
import { hiddenBySettings, readConvoStorage } from "./convoStorage";
import { avatarUrl, mentionsUser, previewText } from "./formatMessage";
import { GLOBE_ICON, GlobalChatWindow } from "./GlobalChatWindow";
import { GLOBAL_PARTY } from "./GlobalRoomClient";
import { GROUP_ICON, GroupChatWindow } from "./GroupChatWindow";
import type { GroupInfo } from "./groupList";
import { fetchConvoParty } from "./convoLinks";
import {
  acceptImages,
  attachButton,
  imageUploadError,
  readBytes,
} from "./images";
import { mirrorSiteScrollbar } from "./siteScrollbar";
import { MessageSoundPlayer, mutedParties } from "./sound";
import { convoNiceTime } from "../common/timestamps";
import {
  createMessageGroup,
  createMessageLine,
  joinsGroup,
  MessageGroup,
} from "./roomLayout";

/**
 * Facebook-style chat UI: a column of avatar bubbles (bottom right) for recent
 * and unread conversations, and small chat windows docked beside them.
 */

export interface OpenChat {
  /** The DM party, the group id (kind "group"), or -1 for the global chat. */
  partyId: number;
  minimized: boolean;
  kind?: "group";
}

export type DockFilter = "all" | "dm" | "group";

/** Which chats are open, kept per browser so they survive page navigation. */
export interface DockState {
  open: OpenChat[];
  collapsed: boolean;
  /** The list layout's All / Direct / Groups filter. */
  filter?: DockFilter;
  /** Whether the Groups bubble is expanded to a bubble per group. */
  groupsExpanded?: boolean;
  /**
   * Group activity HFX tracks itself from live messages and opened groups
   * (HF sends no group read state): last message time and unread count by id.
   */
  groups?: Record<string, { dateline: number; unread: number }>;
}

/** What the dock needs to show the user's private group convos. */
export interface DockGroups {
  /** The user's groups: the cached list, or convo.php's Comrades list fetched once when there's none. */
  list: () => Promise<GroupInfo[]>;
  /** Group names by id from Who's Online Sorting's cached group map (read only, never fetched). */
  mapNames: () => Promise<Record<number, string>>;
  /** Add a group found through a message to the cached list. */
  addToList: (group: GroupInfo) => void;
  /** Drop a group the user left from the cached list. */
  removeFromList: (gid: number) => void;
  /** Which new group messages make the message sound. */
  sound: "mentions" | "all";
}

/** A group's initials for its bubble: "Quantum" → "Q", "The Brotherhood" → "B", "Lions League" → "LL". */
export function groupInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => word && !/^the$/i.test(word));
  const letters = (words.length ? words : [name])
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "");
  return letters.join("").toUpperCase() || "?";
}

/**
 * A group's initials in the group's own HF style: its username class is
 * group<gid>, the same class showgroups.php uses for the group's name.
 */
const groupInitialsMark = (group: GroupChat) =>
  el(
    "span",
    { class: "hfx-chat-group-initials", "aria-hidden": "true" },
    el("span", { class: `group${group.gid}` }, groupInitials(group.name))
  );

const unreadBadge = (unread: number) =>
  unread > 0 &&
  el("span", { class: "hfx-chat-badge" }, unread > 9 ? "9+" : unread);

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
  /** Which side of the page the dock sits on (default right). */
  side?: "left" | "right";
  /** Avatar bubbles (default) or a Messenger-style conversation list. */
  layout?: "bubbles" | "list";
  /** Plays HF's sound for new messages; leave out for no sound. */
  sound?: MessageSoundPlayer;
  /** Private group convos; leave out to hide them. */
  groups?: DockGroups;
  /** Builds the global chat window; leave out to hide the global chat entry. */
  createGlobal?: (options: {
    minimized: boolean;
    onClose: () => void;
    onChange: () => void;
  }) => GlobalChatWindow;
  state: DockState;
  saveState: (state: DockState) => void;
  /** Called once if Convo ends the session or the API looks different. */
  onEnded?: (reason?: string) => void;
  /** The chat id for a user's convo link, 0 if none (default: convo.php's redirect). */
  findParty?: (uid: number) => Promise<number>;
  origin?: string;
}

interface PendingSend {
  text: string;
  requestId: string;
  failed?: string;
  /** An image upload's bytes, kept so it can be retried. */
  image?: ArrayBuffer;
}

interface ChatWindow {
  partyId: number;
  minimized: boolean;
  root: HTMLElement;
  header: HTMLElement;
  avatar: HTMLImageElement;
  /** The avatar and the other person's status dot. */
  avatarBox: HTMLElement;
  name: HTMLAnchorElement;
  status: HTMLElement;
  list: HTMLElement;
  older: HTMLButtonElement;
  notice: HTMLElement;
  pendingBox: HTMLElement;
  typing: HTMLElement;
  input: HTMLTextAreaElement;
  /** Message lines by mid. */
  rendered: Map<number, HTMLElement>;
  /** The newest sender group, which the next message may join. */
  lastGroup: MessageGroup | null;
  pending: PendingSend[];
  loaded: boolean;
  loading: boolean;
  hasOlder: boolean;
  ownTypingTimer?: ReturnType<typeof setTimeout>;
  noticeTimer?: ReturnType<typeof setTimeout>;
}

const TYPING_TIMEOUT = 35000;
// The longest saved windows wait for group setup on page load
const GROUP_SETUP_WAIT_MS = 5000;
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
  /** Chat ids found for users' convo links on this page: uid → party. */
  private readonly partyByUid = new Map<number, number>();
  private readonly client: ConvoClient;
  private readonly origin: string;
  private state: DockState;
  private inboxLoaded = false;
  private restored = false;
  /** Saved windows are back open, so saving state is safe. */
  private windowsRestored = false;
  private ended = false;
  private lastActive = 0;
  /** Users typing right now, with the timer that expires their notice. */
  private readonly typingUsers = new Map<
    number,
    ReturnType<typeof setTimeout>
  >();
  private presenceTimer?: ReturnType<typeof setInterval>;
  private global: GlobalChatWindow | null = null;
  private readonly groupWindows = new Map<number, GroupChatWindow>();
  /** Groups on the cached list (or added to it); others found in messages get added. */
  private readonly listedGroups = new Set<number>();

  constructor(private readonly options: ChatDockOptions) {
    this.client = options.client;
    this.origin = options.origin ?? location.origin;
    this.state = {
      open: (options.state?.open ?? []).filter((chat) =>
        chat?.kind === "group"
          ? Boolean(options.groups) && Number(chat.partyId) > 0
          : Number(chat?.partyId) > 0 ||
            (chat?.partyId === GLOBAL_PARTY && Boolean(options.createGlobal))
      ),
      collapsed: Boolean(options.state?.collapsed),
      filter: options.state?.filter,
      groupsExpanded: options.state?.groupsExpanded,
      groups: options.state?.groups,
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
    mirrorSiteScrollbar(this.root);
    // Statuses come from last-active times, so they age (online → away → offline)
    this.presenceTimer = setInterval(() => {
      this.renderHeads();
      this.windows.forEach((win) => this.renderHeader(win));
    }, 60000);
  }

  /** The page is being left (maybe into the back/forward cache): close the sockets. */
  suspend(): void {
    this.client.disconnect();
    this.global?.suspend();
  }

  /** The page came back from the back/forward cache: reconnect and catch up. */
  resume(): void {
    if (this.ended) return;
    this.client.connect();
    this.global?.resume();
  }

  destroy(): void {
    this.global?.destroy();
    this.global = null;
    this.groupWindows.forEach((win) => win.destroy());
    this.groupWindows.clear();
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
          this.playSound(partyId, last);
        }
      }
      const win = this.windows.get(partyId);
      if (!win) return;
      this.renderMessages(win);
      if (live && this.isActive(win)) client.markRead(partyId);
    });
    client.on("groups", () => {
      this.addUnlistedGroups();
      this.saveGroupActivity();
      this.renderHeads();
    });
    client.on("groupMessages", (gid, live) => {
      if (live) this.playGroupSound(gid);
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
      this.firstReady();
    } else {
      // Catch up on what was missed while disconnected
      this.windows.forEach((win) => {
        if (win.loaded)
          this.client.loadHistory(win.partyId).catch(() => undefined);
        // A first load that failed while disconnected
        else if (!win.minimized) this.ensureLoaded(win);
      });
      this.groupWindows.forEach((win) => win.catchUp());
    }
  }

  /**
   * On the first connection: set up groups, then reopen the saved windows, so
   * restored group windows have their names.
   */
  private async firstReady(): Promise<void> {
    // Saving before the windows are back would drop them from the saved state
    const toRestore = [...this.state.open];
    // Groups are optional: don't let a slow or failed setup hold the windows back
    await Promise.race([
      this.setupGroups().catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, GROUP_SETUP_WAIT_MS)),
    ]);
    // Oldest first, so the newest ends up next to the bubbles
    toRestore.reverse().forEach((chat) => {
      const restore = { minimized: chat.minimized, restore: true };
      if (chat.kind === "group") this.openGroup(chat.partyId, restore);
      else this.openChat(chat.partyId, restore);
    });
    this.windowsRestored = true;
    this.saveGroupActivity();
  }

  /**
   * The user's groups, from the cached list (or convo.php's Comrades list,
   * fetched once when there's none), with HFX's own saved activity per group.
   * Nothing else is requested for groups: activity comes from live messages
   * and from opening a group.
   */
  private async setupGroups(): Promise<void> {
    const groups = this.options.groups;
    if (!groups) return;
    const list = await groups.list();
    const saved = this.state.groups ?? {};
    list.forEach((group) => this.listedGroups.add(group.gid));
    this.client.setGroups(
      list.map((group) => ({
        gid: group.gid,
        name: group.name,
        dateline: saved[group.gid]?.dateline ?? 0,
        unread: saved[group.gid]?.unread ?? (group.unread ? 1 : 0),
      }))
    );
  }

  /**
   * A message from a group the list didn't have (e.g. one joined since): name
   * it from Who's Online Sorting's cached group map, and add it to the list.
   */
  private async addUnlistedGroups(): Promise<void> {
    const groups = this.options.groups;
    if (!groups) return;
    const unlisted = Array.from(this.client.groups.values()).filter(
      (group) => !this.listedGroups.has(group.gid)
    );
    if (!unlisted.length) return;
    unlisted.forEach((group) => this.listedGroups.add(group.gid));
    const names = await groups
      .mapNames()
      .catch(() => ({}) as Record<number, string>);
    for (const group of unlisted) {
      if (names[group.gid]) group.name = names[group.gid];
      groups.addToList({ gid: group.gid, name: group.name });
    }
    this.renderHeads();
  }

  /** Keep each group's last activity and unread count across page loads. */
  private saveGroupActivity(): void {
    if (!this.options.groups || !this.windowsRestored) return;
    const groups: NonNullable<DockState["groups"]> = {};
    for (const group of this.client.groups.values()) {
      groups[group.gid] = { dateline: group.dateline, unread: group.unread };
    }
    const before = JSON.stringify(this.state.groups ?? {});
    if (JSON.stringify(groups) === before) return;
    this.state.groups = groups;
    this.save();
  }

  /**
   * The message sound for a new group message, per the group sound setting
   * (mentions only, or every message), unless it's yours, quiet, muted on
   * convo.php, or the group's window is being looked at.
   */
  private playGroupSound(gid: number): void {
    const sound = this.options.sound;
    const groups = this.options.groups;
    if (!sound || !groups) return;
    const last = this.client.getGroupMessages(gid).slice(-1)[0];
    const me = this.client.me;
    if (!last || last.quiet || !me || last.uid === me.uid) return;
    const mentionsMe = !last.html && mentionsUser(last.text, me, this.origin);
    if (groups.sound === "mentions" && !mentionsMe) return;
    if (this.groupWindows.get(gid)?.isActive()) return;
    if (mutedParties().has(gid)) return;
    sound.play(`group:${gid}:${last.mid}`);
  }

  // ---- Bubbles -------------------------------------------------------------

  /** The user's groups, always shown (pinned under Global chat), most active first. */
  private pinnedGroups(): GroupChat[] {
    return this.options.groups ? this.client.getGroups() : [];
  }

  /** Recent DMs, always including unread and open ones, newest first. */
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
    const shown =
      this.options.layout === "list" ? this.renderList() : this.renderBubbles();
    // The global chat entry is always there when enabled
    this.root.hidden =
      !this.inboxLoaded ||
      (shown === 0 &&
        this.windows.size === 0 &&
        this.groupWindows.size === 0 &&
        !this.options.createGlobal);
  }

  /** Chats with unread messages, for the launcher and list header. */
  private unreadCount(): number {
    return (
      this.client.getConversations().filter((c) => c.unread > 0).length +
      this.pinnedGroups().filter((group) => group.unread > 0).length
    );
  }

  private toggleCollapsed(): void {
    this.state.collapsed = !this.state.collapsed;
    this.save();
    this.renderHeads();
  }

  /** Returns how many chat bubbles it shows. */
  private renderBubbles(): number {
    const conversations = this.visibleConversations(10);
    const groups = this.pinnedGroups();
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

    // From the launcher up: Global chat, the Groups bubble (and the groups when
    // it's expanded), then recent DMs
    const expanded = Boolean(this.state.groupsExpanded);
    const heads = this.state.collapsed
      ? []
      : [
          ...(groups.length ? [this.groupsToggle(groups)] : []),
          ...(expanded ? groups.map((group) => this.groupHead(group)) : []),
          ...conversations.map((conversation) => this.dmHead(conversation)),
        ];
    const global =
      this.options.createGlobal && !this.state.collapsed
        ? [this.globalHead()]
        : [];
    this.heads.replaceChildren(launcher, ...global, ...heads);
    return conversations.length + groups.length;
  }

  /**
   * One bubble for all group chats, so they don't crowd the column: it shows
   * how many groups have unread messages, and expands to a bubble per group.
   */
  private groupsToggle(groups: GroupChat[]): HTMLElement {
    const expanded = Boolean(this.state.groupsExpanded);
    const unread = groups.filter((group) => group.unread > 0).length;
    const anyOpen = groups.some((group) => this.groupWindows.has(group.gid));
    const toggle = el(
      "button",
      {
        type: "button",
        class: [
          "hfx-chat-head hfx-chat-head-group hfx-chat-groups-toggle",
          expanded && "hfx-chat-groups-expanded",
          // An open group window is otherwise hidden while collapsed
          !expanded && anyOpen && "hfx-chat-head-open",
        ]
          .filter(Boolean)
          .join(" "),
        title: expanded ? "Hide group chats" : "Show group chats",
        "aria-label": `${expanded ? "Hide" : "Show"} group chats${unread ? `, ${unread} unread` : ""}`,
        "aria-expanded": String(expanded),
      },
      // Each group shows its own badge once expanded
      [GROUP_ICON(), !expanded && unreadBadge(unread)]
    );
    toggle.addEventListener("click", () => {
      this.state.groupsExpanded = !expanded;
      this.save();
      this.renderHeads();
    });
    return toggle;
  }

  private dmHead(conversation: Conversation): HTMLElement {
    const { other } = conversation;
    const preview = previewText(conversation.lastMessage, this.origin);
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
        title: [`${other.username} (${status})`, typing ? "typing…" : preview]
          .filter(Boolean)
          .join(": "),
        "aria-label": `Chat with ${other.username}, ${status}${typing ? ", typing" : ""}`,
        "data-party": conversation.partyId,
        "data-presence": status,
      },
      [
        el("img", { src: avatarUrl(other.avatar, this.origin), alt: "" }),
        statusDot(status, typing),
        unreadBadge(conversation.unread),
      ]
    );
    head.addEventListener("click", () =>
      this.openChat(conversation.partyId, { focus: true })
    );
    return head;
  }

  /** A group's bubble: a rounded square with the group icon, no status dot. */
  private groupHead(group: GroupChat): HTMLElement {
    const preview = this.groupPreview(group);
    const head = el(
      "button",
      {
        type: "button",
        class: [
          "hfx-chat-head hfx-chat-head-group",
          this.groupWindows.has(group.gid) && "hfx-chat-head-open",
        ]
          .filter(Boolean)
          .join(" "),
        title: preview ? `${group.name}: ${preview}` : group.name,
        "aria-label": `Open ${group.name} group chat`,
        "data-group": group.gid,
      },
      [groupInitialsMark(group), unreadBadge(group.unread)]
    );
    head.addEventListener("click", () =>
      this.openGroup(group.gid, { focus: true })
    );
    return head;
  }

  /** "Name: message" for a group's latest message ("You: …" for your own). */
  private groupPreview(group: GroupChat): string {
    const last = group.lastMessage;
    if (!last) return "";
    const sender =
      last.uid === this.client.me?.uid
        ? "You"
        : this.client.users.get(last.uid)?.username;
    const text = previewText(last, this.origin);
    return sender ? `${sender}: ${text}` : text;
  }

  /** The pinned bubble that opens the global room. */
  private globalHead(): HTMLElement {
    const head = el(
      "button",
      {
        type: "button",
        class: `hfx-chat-head hfx-chat-head-global${this.global ? " hfx-chat-head-open" : ""}`,
        title: "Global chat",
        "aria-label": "Open global chat",
        "data-party": GLOBAL_PARTY,
      },
      GLOBE_ICON()
    );
    head.addEventListener("click", () =>
      this.openChat(GLOBAL_PARTY, { focus: true })
    );
    return head;
  }

  /** The pinned first list row that opens the global room. */
  private globalRow(): HTMLElement {
    const row = el(
      "button",
      {
        type: "button",
        class: `hfx-chat-row hfx-chat-row-global${this.global ? " hfx-chat-row-open" : ""}`,
        title: "Global chat",
        "data-party": GLOBAL_PARTY,
      },
      [
        el(
          "span",
          { class: "hfx-chat-row-avatar hfx-chat-row-globe" },
          GLOBE_ICON()
        ),
        el("span", { class: "hfx-chat-row-body" }, [
          el("span", { class: "hfx-chat-row-top" }, [
            el("span", { class: "hfx-chat-row-name" }, "Global chat"),
          ]),
          el(
            "span",
            { class: "hfx-chat-row-preview" },
            "Chat with everyone on HF"
          ),
        ]),
      ]
    );
    row.addEventListener("click", () =>
      this.openChat(GLOBAL_PARTY, { focus: true })
    );
    return el("li", null, row);
  }

  /** All / Direct / Groups chips for the list. */
  private filterChips(): HTMLElement {
    const current = this.state.filter ?? "all";
    const chips = (
      [
        ["all", "All"],
        ["dm", "Direct"],
        ["group", "Groups"],
      ] as [DockFilter, string][]
    ).map(([value, label]) => {
      const chip = el(
        "button",
        {
          type: "button",
          class: `hfx-chat-filter${value === current ? " hfx-chat-filter-on" : ""}`,
          "aria-pressed": String(value === current),
          "data-filter": value,
        },
        label
      );
      chip.addEventListener("click", () => {
        this.state.filter = value;
        this.save();
        this.renderHeads();
      });
      return chip;
    });
    return el(
      "div",
      { class: "hfx-chat-filters", role: "group", "aria-label": "Show" },
      chips
    );
  }

  /**
   * Messenger-style list: a "Chats" panel docked at the bottom edge, with a
   * row per chat (avatar, name, time, last message or typing).
   */
  /** Returns how many chat rows it shows. */
  private renderList(): number {
    const filter = this.options.groups ? (this.state.filter ?? "all") : "all";
    // Groups are pinned under Global chat; DMs follow by recency
    const groups = filter === "dm" ? [] : this.pinnedGroups();
    const conversations =
      filter === "group" ? [] : this.visibleConversations(20);
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

    const rows = [
      ...groups.map((group) => this.groupRow(group, now)),
      ...conversations.map((conversation) => this.dmRow(conversation, now)),
    ];

    this.heads.replaceChildren();
    appendChildren(this.heads, [
      header,
      !this.state.collapsed && this.options.groups && this.filterChips(),
      !this.state.collapsed &&
        el(
          "ul",
          { class: "hfx-chat-list-rows", "aria-label": "Convo conversations" },
          [
            this.options.createGlobal && filter !== "dm" && this.globalRow(),
            ...rows,
          ]
        ),
    ]);
    return rows.length;
  }

  private dmRow(conversation: Conversation, now: number): HTMLElement {
    const { other, lastMessage } = conversation;
    const status = presence(other.lastActive);
    const typing = this.typingUsers.has(other.uid);
    const unread = conversation.unread > 0;
    const mine = lastMessage && lastMessage.uid === this.client.me?.uid;
    // The avatar's dot animates while they type; the preview says so too
    const preview = typing
      ? "typing…"
      : [mine && "You: ", previewText(lastMessage, this.origin)];

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
        this.rowBody(
          el("span", { class: "hfx-chat-row-name" }, other.username),
          conversation.dateline,
          now,
          preview
        ),
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
  }

  private groupRow(group: GroupChat, now: number): HTMLElement {
    const unread = group.unread > 0;
    const row = el(
      "button",
      {
        type: "button",
        class: [
          "hfx-chat-row hfx-chat-row-group",
          unread && "hfx-chat-row-unread",
          this.groupWindows.has(group.gid) && "hfx-chat-row-open",
        ]
          .filter(Boolean)
          .join(" "),
        title: `${group.name} (group)`,
        "data-group": group.gid,
      },
      [
        el(
          "span",
          { class: "hfx-chat-row-avatar hfx-chat-row-group-icon" },
          groupInitialsMark(group)
        ),
        this.rowBody(
          // The group's name in its HF style
          el(
            "span",
            { class: "hfx-chat-row-name" },
            el("span", { class: `group${group.gid}` }, group.name)
          ),
          group.dateline,
          now,
          this.groupPreview(group) || "Group chat"
        ),
        unread &&
          el(
            "span",
            { class: "hfx-chat-badge hfx-chat-row-badge" },
            group.unread > 9 ? "9+" : group.unread
          ),
      ]
    );
    row.addEventListener("click", () =>
      this.openGroup(group.gid, { focus: true })
    );
    return el("li", null, row);
  }

  private rowBody(
    name: HTMLElement,
    dateline: number,
    now: number,
    preview: ElChild | ElChild[]
  ): HTMLElement {
    return el("span", { class: "hfx-chat-row-body" }, [
      el("span", { class: "hfx-chat-row-top" }, [
        name,
        dateline > 0 &&
          el(
            "span",
            { class: "hfx-chat-row-time", title: convoNiceTime(dateline) },
            shortTime(dateline, now)
          ),
      ]),
      el("span", { class: "hfx-chat-row-preview" }, preview),
    ]);
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
    if (partyId === GLOBAL_PARTY) {
      this.openGlobal({ focus, minimized, restore });
      return;
    }
    let win = this.windows.get(partyId);
    if (!win) {
      win = this.createWindow(partyId, minimized);
      this.windows.set(partyId, win);
      // The newest window sits next to the bubbles
      this.heads.after(win.root);
      this.closeWindowsThatDontFit();
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

  /**
   * Open the 1:1 chat with a user, as their Convo button on a profile or post
   * would on convo.php. A chat already loaded opens straight away; otherwise
   * convo.php's redirect for the user names it (one request, remembered for
   * this page). Resolves false when there's no chat to open, so the caller
   * can go to convo.php instead.
   */
  async openChatWithUser(uid: number, hint?: ChatUser): Promise<boolean> {
    const me = this.client.me;
    if (this.client.status !== "ready" || !me || uid === me.uid) return false;
    let partyId =
      this.client.getConversations().find((c) => c.other.uid === uid)
        ?.partyId ?? this.partyByUid.get(uid);
    if (!partyId) {
      const findParty =
        this.options.findParty ?? ((id) => fetchConvoParty(id, this.origin));
      partyId = await findParty(uid);
      if (!partyId) return false;
      this.partyByUid.set(uid, partyId);
    }
    // The header shows who it is before the history (which names them) arrives
    if (hint && !this.client.conversations.has(partyId))
      this.client.addConversation(partyId, hint);
    this.openChat(partyId, { focus: true });
    return true;
  }

  /** Open the global room's window; its socket connects while it's expanded. */
  private openGlobal({
    focus = false,
    minimized = false,
    restore = false,
  }): void {
    const create = this.options.createGlobal;
    if (!create) return;
    if (!this.global) {
      const global: GlobalChatWindow = create({
        minimized,
        onClose: () => this.closeGlobal(),
        onChange: () => this.save(),
      });
      this.global = global;
      this.heads.after(global.root);
      this.closeWindowsThatDontFit();
    } else if (!restore) {
      this.global.setMinimized(false);
    }
    if (!restore) this.save();
    this.renderHeads();
    if (focus) this.global?.focus();
  }

  private closeGlobal(): void {
    if (!this.global) return;
    this.global.destroy();
    this.global = null;
    this.save();
    this.renderHeads();
  }

  /** Windows in the dock, newest (closest to the bubbles) first. */
  private openWindowRoots(): HTMLElement[] {
    return Array.from(
      this.root.querySelectorAll<HTMLElement>(":scope > .hfx-chat-window")
    );
  }

  /** Close the oldest windows that no longer fit beside each other. */
  private closeWindowsThatDontFit(): void {
    const roots = this.openWindowRoots();
    while (roots.length > this.maxWindows()) {
      const chat = openChatOf(roots.pop()!);
      if (chat.kind === "group") this.closeGroup(chat.partyId);
      else if (chat.partyId === GLOBAL_PARTY) this.closeGlobal();
      else this.closeChat(chat.partyId);
    }
  }

  /** Open a group's window; it loads the group's history once expanded. */
  private openGroup(
    gid: number,
    { focus = false, minimized = false, restore = false } = {}
  ): void {
    if (!this.options.groups) return;
    let win = this.groupWindows.get(gid);
    if (!win) {
      const group = this.client.groups.get(gid);
      win = new GroupChatWindow({
        client: this.client,
        gid,
        name: group?.name ?? `Group ${gid}`,
        minimized,
        typingIndicators: this.options.typingIndicators,
        origin: this.origin,
        onClose: () => this.closeGroup(gid),
        onChange: () => this.save(),
        onLeft: () => this.leftGroup(gid),
      });
      this.groupWindows.set(gid, win);
      this.heads.after(win.root);
      this.closeWindowsThatDontFit();
    } else if (!restore) {
      win.setMinimized(false);
    }
    if (!restore) this.save();
    this.renderHeads();
    if (focus) {
      win.focus();
      this.client.markGroupRead(gid);
    }
  }

  private closeGroup(gid: number): void {
    const win = this.groupWindows.get(gid);
    if (!win) return;
    win.destroy();
    this.groupWindows.delete(gid);
    this.save();
    this.renderHeads();
  }

  /** The user left a group with /leave: forget it. */
  private leftGroup(gid: number): void {
    this.closeGroup(gid);
    this.listedGroups.delete(gid);
    this.client.removeGroup(gid);
    this.options.groups?.removeFromList(gid);
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
    // Their status dot sits on the avatar, as on their bubble or row
    const avatarBox = el("span", { class: "hfx-chat-header-avatar" }, avatar);
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
      avatarBox,
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
      {
        class: "hfx-chat-messages hfx-gc-messages",
        role: "log",
        "aria-live": "polite",
      },
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
    const commands = new CommandPicker(
      input,
      () => commandsFor("dm"),
      () => {
        this.autoGrow(input);
        this.onOwnTyping(win);
      }
    );
    const root = el(
      "section",
      {
        class: `hfx-chat-window hfx-gc-window${minimized ? " hfx-chat-minimized" : ""}`,
        "data-party": partyId,
      },
      [
        header,
        list,
        notice,
        typing,
        el("div", { class: "hfx-chat-compose" }, [
          commands.root,
          attachButton((file) => this.uploadImage(win, file)),
          input,
        ]),
      ]
    );

    const win: ChatWindow = {
      partyId,
      minimized,
      root,
      header,
      avatar,
      avatarBox,
      name,
      status,
      list,
      older,
      notice,
      pendingBox,
      typing,
      input,
      rendered: new Map(),
      lastGroup: null,
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
      if (commands.handleKey(event)) return;
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        this.send(win);
      }
    });
    input.addEventListener("input", () => {
      this.autoGrow(input);
      this.onOwnTyping(win);
    });
    acceptImages(root, (file) => this.uploadImage(win, file));

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
      // Their status, and the typing pill, as on their bubble or row
      const status = presence(other.lastActive);
      const typing = this.typingUsers.has(other.uid);
      win.avatarBox.replaceChildren(win.avatar, statusDot(status, typing));
      win.avatarBox.dataset.presence = status;
      win.avatarBox.title = `${other.username} is ${typing ? "typing" : status}`;
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

  /**
   * Show the chat's messages in the grouped layout. New ones join the last
   * sender group or start one; when older ones arrive (Load older, or a gap
   * filled after reconnecting), everything is redrawn and the view kept.
   */
  private renderMessages(win: ChatWindow): void {
    const all = this.client.getMessages(win.partyId);
    // Leave out flips and jackpot plays hidden with /flip hide or /jackpot hide
    const storage = readConvoStorage();
    const me = this.client.me?.uid;
    const messages = all.filter(
      (message) => !hiddenBySettings(message, me, storage)
    );
    const list = win.list;
    const nearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    const previousHeight = list.scrollHeight;
    const firstBatch = win.rendered.size === 0;
    const lastRendered = Math.max(...Array.from(win.rendered.keys()), 0);
    const fresh = messages.filter((message) => !win.rendered.has(message.mid));

    if (fresh.some((message) => message.mid < lastRendered)) {
      list.querySelectorAll(".hfx-gc-group").forEach((group) => group.remove());
      win.rendered.clear();
      win.lastGroup = null;
      messages.forEach((message) => this.appendLine(win, message));
    } else {
      fresh.forEach((message) => this.appendLine(win, message));
    }
    if (all.length) this.setListNotice(win, "");

    // Drop pending sends whose echo has arrived
    const echoed = new Set(
      all.map((message) => message.requestId).filter(Boolean)
    );
    const before = win.pending.length;
    win.pending = win.pending.filter(
      (pending) => !echoed.has(pending.requestId)
    );
    if (win.pending.length !== before) this.renderPending(win);

    win.older.hidden = !win.loaded || !win.hasOlder;
    const addedNewer = fresh.some((message) => message.mid > lastRendered);
    if (firstBatch || (addedNewer && nearBottom)) {
      this.scrollToBottom(win);
    } else if (fresh.length && !addedNewer) {
      // Older messages were added above: keep the view where it was
      list.scrollTop += list.scrollHeight - previousHeight;
    }
  }

  /** Add a message's line to the last group, or a new group for it. */
  private appendLine(win: ChatWindow, message: ChatMessage): void {
    const line = createMessageLine(message, this.origin, {
      "data-mid": message.mid,
    });
    win.rendered.set(message.mid, line);
    const group = win.lastGroup;
    if (group && joinsGroup(group, message)) {
      group.lines.appendChild(line);
      group.dateline = message.dateline;
      return;
    }
    const user =
      this.client.users.get(message.uid) ??
      (message.uid === this.client.me?.uid ? this.client.me : undefined);
    win.lastGroup = createMessageGroup(message, user, line, this.origin);
    win.list.insertBefore(win.lastGroup.root, win.pendingBox);
  }

  private renderPending(win: ChatWindow): void {
    const nodes = win.pending.flatMap((pending) => {
      const bubble = el(
        "div",
        {
          class: `hfx-gc-pending ${pending.failed ? "hfx-chat-failed" : "hfx-chat-pending"}`,
          title: pending.failed ? "Not confirmed" : "Sending…",
        },
        pending.text
      );
      if (!pending.failed) return [bubble];
      const retry = el("button", { type: "button" }, "Retry");
      retry.addEventListener("click", () => {
        if (!window.confirm(UNCONFIRMED_RETRY)) return;
        // Keep it listed until the retry can actually start
        if (!this.canSend(win, pending.image ? "image" : "message")) return;
        win.pending = win.pending.filter((p) => p !== pending);
        if (pending.image) this.sendImage(win, pending.image);
        else this.send(win, pending.text);
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
    if (retryText === undefined && (await this.runCommand(win, text))) return;
    if (!this.canSend(win, "message")) return;
    if (retryText === undefined) {
      win.input.value = "";
      this.autoGrow(win.input);
    }
    this.stopOwnTyping(win);

    const pending: PendingSend = {
      text,
      requestId: this.client.createRequestId(),
    };
    await this.deliver(
      win,
      pending,
      () => this.client.send(win.partyId, text, pending.requestId),
      // Never reached the server: put the text back
      () => {
        if (!win.input.value) win.input.value = text;
      }
    );
  }

  /** Run what was typed if convo.php would run it as a command; false if it's a message. */
  private async runCommand(win: ChatWindow, text: string): Promise<boolean> {
    const command = parseCommand(text);
    if (command.kind === "message") return false;
    win.input.value = "";
    this.autoGrow(win.input);
    this.stopOwnTyping(win);
    const ran = await runCommand(command, {
      partyId: win.partyId,
      origin: this.origin,
      request: (request) => this.client.command(request),
      reply: (content) => this.showReply(win, content),
      notice: (message) => this.showNotice(win, message),
      // Only group convos can be left; DM windows are one-to-one
      leave: async () =>
        this.showReply(win, "/leave only works in group chats."),
    });
    if (!ran && !win.input.value) win.input.value = text;
    return true;
  }

  /** A pasted or dropped image: HF's checks, then upload it like a message. */
  private async uploadImage(win: ChatWindow, file: File): Promise<void> {
    const error = imageUploadError(file);
    if (error) {
      this.showNotice(win, error);
      return;
    }
    let image: ArrayBuffer;
    try {
      image = await readBytes(file);
    } catch {
      this.showNotice(win, "Couldn't read the image.");
      return;
    }
    await this.sendImage(win, image);
  }

  private async sendImage(win: ChatWindow, image: ArrayBuffer): Promise<void> {
    if (!this.canSend(win, "image")) return;
    const pending: PendingSend = {
      text: "Sending image…",
      image,
      requestId: this.client.createRequestId(),
    };
    await this.deliver(win, pending, () =>
      this.client.sendImage(win.partyId, image, pending.requestId)
    );
  }

  /** Whether a send can start now (one at a time, while connected); if not, says why. */
  private canSend(win: ChatWindow, what: "message" | "image"): boolean {
    if (this.client.isSending) {
      this.showNotice(win, "Please wait for the pending send to finish.");
      return false;
    }
    if (this.client.status !== "ready") {
      this.showNotice(win, `Convo is disconnected. Your ${what} was not sent.`);
      return false;
    }
    return true;
  }

  /**
   * Show a send as pending until it's acked, then rely on the echo. Failures
   * that never reached the server are undone; unconfirmed ones offer a retry.
   */
  private async deliver(
    win: ChatWindow,
    pending: PendingSend,
    run: () => Promise<unknown>,
    undo?: () => void
  ): Promise<void> {
    win.pending.push(pending);
    this.renderPending(win);
    this.scrollToBottom(win);

    try {
      await run();
      const echoed = this.client
        .getMessages(win.partyId)
        .some((message) => message.requestId === pending.requestId);
      win.pending = win.pending.filter((p) => p !== pending);
      this.renderPending(win);
      // The echo normally arrives before the ack; fetch it if it didn't
      if (!echoed) this.client.loadHistory(win.partyId).catch(() => undefined);
    } catch (error: any) {
      const message = String(error?.message || "Message failed.");
      // Never sent or refused by the server: undo. Only an unconfirmed send
      // may have gone through, so only it offers a retry
      if (wasNotDelivered(error)) {
        win.pending = win.pending.filter((p) => p !== pending);
        undo?.();
        this.showNotice(win, message);
      } else {
        pending.failed = message;
      }
      this.renderPending(win);
    }
  }

  private showNotice(win: ChatWindow, text: string): void {
    clearTimeout(win.noticeTimer);
    win.notice.classList.remove("hfx-chat-reply");
    win.notice.textContent = text;
    win.notice.hidden = false;
    win.noticeTimer = setTimeout(() => {
      win.notice.hidden = true;
    }, 6000);
  }

  /** A command's answer, shown until dismissed. */
  private showReply(win: ChatWindow, content: string | Node): void {
    clearTimeout(win.noticeTimer);
    showReply(win.notice, content);
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
    this.windows.forEach((win) => {
      this.renderTyping(win);
      this.renderHeader(win);
    });
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
  /**
   * HF's new-message sound, when enabled: not for messages HF marks quiet,
   * conversations muted on convo.php, or a chat the user is looking at.
   */
  private playSound(partyId: number, message: ChatMessage): void {
    const sound = this.options.sound;
    if (!sound || message.quiet) return;
    const win = this.windows.get(partyId);
    if (win && this.isActive(win)) return;
    if (mutedParties().has(partyId)) return;
    sound.play(`${partyId}:${message.mid}`);
  }

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
    const open = this.openWindowRoots().map(openChatOf);
    this.state = { ...this.state, open };
    this.options.saveState(this.state);
  }
}

/** The saved form of an open window, from its element (`data-party`, e.g. "500", "-1" or "g48"). */
function openChatOf(root: HTMLElement): OpenChat {
  const party = root.dataset.party ?? "";
  const minimized = root.classList.contains("hfx-chat-minimized");
  return party.startsWith("g")
    ? { partyId: Number(party.slice(1)), minimized, kind: "group" }
    : { partyId: Number(party), minimized };
}
