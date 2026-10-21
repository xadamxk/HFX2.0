import { SocketIOClient } from "./SocketIOClient";

/**
 * Data layer for Convo chat bubbles: talks to HF's Convo websocket (the same
 * one convo.php uses) and keeps conversations and loaded messages in memory.
 * Nothing here is persisted; message bodies never leave this tab.
 *
 * Protocol notes (verified 2026-10-20, see #393):
 * - A ticket from `POST /convo.php?action=socket_ticket` authenticates each connection.
 * - After `convo_ready`, `convo_join {publicRoom:false}` subscribes to the user's own conversations.
 * - `load_more_inbox <offset>` lists the latest message of 20 conversations (offset 0 = newest).
 * - `convo_loadmessages` (acked) sends `convo_receivemessage_bulk` for one party, oldest first.
 * - `convo_receivemessage` arrives for every conversation, including our own sends (with requestId).
 */

export const HELPBOT_UID = 1337;
export const HISTORY_PAGE_SIZE = 20;
const SEND_TIMEOUT = 20000;
const SEEN_LIMIT = 10000;

export interface ChatUser {
  uid: number;
  username: string;
  avatar: string;
  /** Unix time the user was last active on HF, 0 if unknown. */
  lastActive: number;
  /** The group HF styles their username with (`class="group<N>"`), 0 if unknown. */
  group?: number;
}

export type Presence = "online" | "away" | "offline";

// MyBB's "who's online" cutoff, which convo.php's online dots also follow
const ONLINE_SECONDS = 15 * 60;
const AWAY_SECONDS = 60 * 60;

/**
 * Online status from a user's last-active time: online within 15 minutes,
 * away within an hour, offline after that. HF sends no explicit status, so
 * (like convo.php) this can't tell invisible users apart.
 */
export function presence(
  lastActive: number,
  now = Math.floor(Date.now() / 1000)
): Presence {
  if (lastActive <= 0) return "offline";
  const idle = now - lastActive;
  if (idle <= ONLINE_SECONDS) return "online";
  return idle <= AWAY_SECONDS ? "away" : "offline";
}

export interface ChatImage {
  type: string;
  data: string;
  width: number;
  height: number;
}

export interface ChatMessage {
  mid: number;
  partyId: number;
  uid: number;
  text: string;
  dateline: number;
  image?: ChatImage;
  /** Helpbot HTML the server marked as trusted; render with renderTrustedHtml. */
  html?: boolean;
  requestId?: string;
  /** The server sent it with noSound (history, system notices): HF plays no sound for it. */
  quiet?: boolean;
  /** A private group convo message; `partyId` is then the group id. */
  group?: boolean;
}

/** A private group convo ("Comrades" on convo.php). Group ids are HF usergroup ids. */
export interface GroupChat {
  gid: number;
  /** From convo.php's Comrades list; "Group <gid>" when unknown. */
  name: string;
  lastMessage?: ChatMessage;
  dateline: number;
  /** HF has no read receipts for groups, so this is HFX's own count. */
  unread: number;
  /** Members seen in loaded messages (HF sends no member list for groups). */
  members: Set<number>;
}

export interface Conversation {
  partyId: number;
  other: ChatUser;
  lastMessage?: ChatMessage;
  dateline: number;
  unread: number;
}

export type ConvoStatus = "connecting" | "ready" | "disconnected" | "ended";

export interface ConvoClientEvents {
  status: (status: ConvoStatus, reason?: string) => void;
  conversations: () => void;
  /** Messages for a party were added (history or live). `live` is true for new arrivals. */
  messages: (partyId: number, live: boolean) => void;
  /** The group list or a group's unread/latest message changed. */
  groups: () => void;
  /** Messages for a group were added. `live` is true for new arrivals. */
  groupMessages: (gid: number, live: boolean) => void;
  typing: (uid: number, typing: boolean) => void;
  error: (message: string) => void;
}

type Listener<K extends keyof ConvoClientEvents> = ConvoClientEvents[K];

export interface ConvoClientOptions {
  postKey: string;
  origin?: string;
  createSocket?: (
    auth: () => Promise<Record<string, unknown>>
  ) => SocketIOClient;
  fetch?: typeof fetch;
  randomUUID?: () => string;
}

export const toInt = (value: unknown): number => {
  const n =
    typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
};

/** The uids in a party string ("uidA,uidB"). */
export function partyUids(party: unknown): number[] {
  return String(party ?? "")
    .split(",")
    .map(toInt)
    .filter((uid) => uid > 0);
}

export function parseUser(raw: any): ChatUser | null {
  const uid = toInt(raw?.uid);
  if (!uid || typeof raw?.username !== "string") return null;
  return {
    uid,
    username: raw.username,
    avatar: typeof raw.avatar === "string" ? raw.avatar : "",
    lastActive: toInt(raw.lastactive),
    group: toInt(raw.group) || toInt(raw.displaygroup) || toInt(raw.usergroup),
  };
}

/** The Convo websocket URL for an HF origin. */
export function convoSocketUrl(origin: string): string {
  return `${origin.replace(/^http/, "ws")}/convo-ws/?EIO=4&transport=websocket`;
}

/**
 * A one-time ticket to authenticate a Convo socket connection. Every
 * connection attempt needs a fresh one.
 */
export async function fetchConvoTicket(
  origin: string,
  postKey: string,
  fetchFn: typeof fetch
): Promise<string> {
  const response = await fetchFn(`${origin}/convo.php?action=socket_ticket`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ my_post_key: postKey }).toString(),
  });
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error("Convo authentication failed.");
  }
  if (!response.ok || typeof data?.ticket !== "string" || !data.ticket) {
    throw new Error(data?.error || "Convo authentication failed.");
  }
  return data.ticket;
}

/**
 * Normalize a message from `convo_receivemessage(_bulk)`: a 1:1 message, or a
 * group message (`group: true`). Null for the public room and anything else.
 */
export function parseMessage(raw: any): ChatMessage | null {
  if (!raw || typeof raw.message !== "string") return null;
  const partyId = toInt(raw.party_id);
  const mid = toInt(raw.mid);
  // The public room (-1) has its own client (GlobalRoomClient)
  if (partyId <= 0) return null;
  const message: ChatMessage = {
    mid,
    partyId,
    uid: toInt(raw.uid),
    text: raw.message,
    dateline: toInt(raw.dateline) || Math.floor(Date.now() / 1000),
  };
  if (raw.isImageDownload) {
    message.text = "";
    message.image = {
      type: String(raw.imageType ?? ""),
      data: raw.message,
      width: toInt(raw.imageWidth),
      height: toInt(raw.imageHeight),
    };
  }
  if (message.uid === HELPBOT_UID && raw.trustedHtml) message.html = true;
  if (typeof raw.requestId === "string") message.requestId = raw.requestId;
  if ("noSound" in raw) message.quiet = true;
  if (raw.is_group) message.group = true;
  return message;
}

/** The key the typing guard and history requests use; DM and group ids overlap. */
const chatKey = (group: boolean, id: number) =>
  `${group ? "group" : "dm"}:${id}`;

export class ConvoClient {
  me: ChatUser | null = null;
  status: ConvoStatus = "connecting";
  readonly users = new Map<number, ChatUser>();
  readonly conversations = new Map<number, Conversation>();
  /** The user's private group convos, by group id. */
  readonly groups = new Map<number, GroupChat>();
  private readonly messages = new Map<number, ChatMessage[]>();
  private readonly groupMessages = new Map<number, ChatMessage[]>();
  private readonly seen = new Set<string>();
  private readonly listeners = new Map<string, Set<(...args: any[]) => void>>();
  private readonly socket: SocketIOClient;
  private readonly fetchFn: typeof fetch;
  private readonly origin: string;
  private readonly randomUUID: () => string;
  private sending = false;
  /**
   * The chat (see chatKey) convo_loadmessages last loaded; the server may scope
   * typing notices to it. Empty when unknown.
   */
  private loadedParty = "";
  private typingParty = "";

  constructor(private readonly options: ConvoClientOptions) {
    this.origin = options.origin ?? location.origin;
    this.fetchFn = options.fetch ?? ((...args) => fetch(...args));
    this.randomUUID = options.randomUUID ?? (() => crypto.randomUUID());
    const auth = async () => ({
      ticket: await fetchConvoTicket(
        this.origin,
        options.postKey,
        this.fetchFn
      ),
    });
    this.socket = options.createSocket
      ? options.createSocket(auth)
      : new SocketIOClient({ url: convoSocketUrl(this.origin), auth });
    this.bindSocket();
  }

  on<K extends keyof ConvoClientEvents>(event: K, listener: Listener<K>): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return this;
  }

  off<K extends keyof ConvoClientEvents>(
    event: K,
    listener: Listener<K>
  ): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  connect(): void {
    this.setStatus("connecting");
    this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  /** Conversations, most recent first. */
  getConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.dateline - a.dateline || b.partyId - a.partyId
    );
  }

  /** Loaded messages for a party, oldest first. */
  getMessages(partyId: number): ChatMessage[] {
    return this.messages.get(partyId) ?? [];
  }

  /** Request a page of the conversation list (offset 0 = most recent). */
  loadInbox(offset = 0): void {
    this.socket.emit("load_more_inbox", offset);
  }

  /**
   * Load the newest messages of a conversation, or the ones after what's
   * already loaded (e.g. after a reconnect).
   */
  async loadHistory(partyId: number): Promise<void> {
    await this.loadNewer(false, partyId);
  }

  /** Load the page before the oldest loaded message. Resolves false when there is nothing older. */
  async loadOlder(partyId: number): Promise<boolean> {
    return this.loadOlderPage(false, partyId);
  }

  /** Loaded messages for a group, oldest first. */
  getGroupMessages(gid: number): ChatMessage[] {
    return this.groupMessages.get(gid) ?? [];
  }

  /** Groups, most recent activity first; ones with no known activity last, by name. */
  getGroups(): GroupChat[] {
    return Array.from(this.groups.values()).sort(
      (a, b) => b.dateline - a.dateline || a.name.localeCompare(b.name)
    );
  }

  /**
   * Set the user's groups (from convo.php's Comrades list). Keeps what's
   * already known about each, e.g. unread counts and the latest message.
   */
  setGroups(
    list: { gid: number; name: string; dateline?: number; unread?: number }[]
  ): void {
    for (const { gid, name, dateline = 0, unread = 0 } of list) {
      const existing = this.groups.get(gid);
      if (existing) {
        existing.name = name;
        existing.dateline = Math.max(existing.dateline, dateline);
        existing.unread = Math.max(existing.unread, unread);
      } else {
        this.groups.set(gid, {
          gid,
          name,
          dateline,
          unread,
          members: new Set(),
        });
      }
    }
    this.fire("groups");
  }

  /** Load a group's newest messages, or the ones after what's loaded. */
  async loadGroupHistory(gid: number): Promise<void> {
    await this.loadNewer(true, gid);
  }

  /** Load the page of group messages before the oldest loaded. False when there's nothing older. */
  async loadOlderGroup(gid: number): Promise<boolean> {
    return this.loadOlderPage(true, gid);
  }

  /** Send a message to a group (convo_newmessage_group), with the same one-pending rule. */
  async sendGroup(
    gid: number,
    text: string,
    requestId = this.createRequestId()
  ): Promise<{ requestId: string }> {
    const message = text.trim();
    if (!message) throw new Error("Message is empty.");
    await this.mutate(chatKey(true, gid), "convo_newmessage_group", {
      partyID: gid,
      message,
      requestId,
    });
    return { requestId };
  }

  /** Clear a group's unread count. Local only: HF has no read receipts for groups. */
  markGroupRead(gid: number): void {
    const group = this.groups.get(gid);
    if (!group || !group.unread) return;
    group.unread = 0;
    this.fire("groups");
  }

  /** Tell a group we're typing; same rule as setTyping. */
  setGroupTyping(gid: number, typing: boolean): void {
    this.typing(chatKey(true, gid), typing);
  }

  /**
   * Whether this chat was the last one convo_loadmessages loaded. Typing
   * notices carry no party id, and the server may scope them to that chat.
   */
  isLastLoaded(group: boolean, id: number): boolean {
    return this.loadedParty === chatKey(group, id);
  }

  private async loadNewer(group: boolean, id: number): Promise<void> {
    const list = group ? this.getGroupMessages(id) : this.getMessages(id);
    let cursor = list.length ? list[list.length - 1].mid : 0;
    // Cap the catch-up loop; each page can be hundreds of KB
    for (let page = 0; page < 5; page++) {
      const result = await this.loadMessages(group, id, cursor, "new");
      if (!result?.hasMore || !toInt(result.lastMid)) return;
      cursor = toInt(result.lastMid);
    }
  }

  private async loadOlderPage(group: boolean, id: number): Promise<boolean> {
    const loaded = group ? this.getGroupMessages(id) : this.getMessages(id);
    if (!loaded.length) return false;
    const before = loaded.length;
    await this.loadMessages(group, id, loaded[0].mid, "old");
    const after = group ? this.getGroupMessages(id) : this.getMessages(id);
    return after.length - before >= HISTORY_PAGE_SIZE;
  }

  /**
   * Send a message. HF allows one pending send at a time; the message shows up
   * through convo_receivemessage (with our requestId) before the ack.
   */
  async send(
    partyId: number,
    text: string,
    requestId = this.createRequestId()
  ): Promise<{ requestId: string }> {
    const message = text.trim();
    if (!message) throw new Error("Message is empty.");
    await this.mutate(chatKey(false, partyId), "convo_newmessage", {
      partyID: partyId,
      message,
      requestId,
    });
    return { requestId };
  }

  /**
   * Upload an image (PNG, JPG or GIF bytes), as HF's own paste and drop do.
   * Same one-pending-send rule as messages; it comes back as an image message.
   */
  async sendImage(
    partyId: number,
    imageData: ArrayBuffer,
    requestId = this.createRequestId()
  ): Promise<{ requestId: string }> {
    await this.mutate(chatKey(false, partyId), "convo_imageupload", {
      partyID: partyId,
      imageData,
      requestId,
    });
    return { requestId };
  }

  /** Send something that adds to a conversation, waiting for the server's ack. */
  private async mutate(
    key: string,
    event: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (this.sending)
      throw new Error("Please wait for the pending send to finish.");
    if (!this.socket.connected || this.status !== "ready") {
      throw new Error("Convo is disconnected. Your message was not sent.");
    }
    this.sending = true;
    try {
      const result = await this.socket
        .emitWithAck(event, data, SEND_TIMEOUT)
        .catch((error: Error) => {
          throw new Error(
            error.message === "Timed out waiting for a reply." ||
              error.message === "Disconnected."
              ? "Delivery is unconfirmed. Check the conversation history before resending."
              : error.message
          );
        });
      if (!result?.ok)
        throw new Error(result?.error || "Convo request failed.");
      this.typing(key, false);
    } finally {
      this.sending = false;
    }
  }

  /** An id for a send, echoed back on the message so it can be matched. */
  createRequestId(): string {
    return this.randomUUID();
  }

  get isSending(): boolean {
    return this.sending;
  }

  /** Mark a conversation read. Only call this when the user is looking at it. */
  markRead(partyId: number): void {
    const conversation = this.conversations.get(partyId);
    if (conversation) conversation.unread = 0;
    if (this.status === "ready") {
      this.socket.emitWithAck("mark_read", partyId).catch(() => {
        // Not critical: the conversation stays unread on HF
      });
    }
    this.fire("conversations");
  }

  /**
   * Tell the other user we're typing. The server's typing notices carry no party
   * id, so only send them for the party convo_loadmessages last loaded.
   */
  setTyping(partyId: number, typing: boolean): void {
    this.typing(chatKey(false, partyId), typing);
  }

  private typing(key: string, typing: boolean): void {
    if (typing) {
      if (key !== this.loadedParty || this.typingParty === key) return;
      this.typingParty = key;
      this.socket.emit("type_notice_start", true);
    } else if (this.typingParty === key) {
      this.typingParty = "";
      this.socket.emit("type_notice_stop", true);
    }
  }

  private async loadMessages(
    group: boolean,
    id: number,
    mid: number,
    position: "new" | "old"
  ): Promise<{ ok: boolean; hasMore?: boolean; lastMid?: number } | undefined> {
    this.loadedParty = chatKey(group, id);
    const result = await this.socket.emitWithAck("convo_loadmessages", {
      party: id,
      mid,
      position,
      bulk: true,
      is_group: group,
    });
    if (!result?.ok)
      throw new Error(result?.error || "Couldn't load messages.");
    return result;
  }

  private bindSocket(): void {
    const socket = this.socket;
    socket.on("convo_ready", (data: any) => this.onReady(data));
    socket.on("disconnect", (reason: string) => {
      this.setStatus(
        reason === "io server disconnect" ? "ended" : "disconnected",
        reason
      );
    });
    socket.on("reconnect_failed", () =>
      this.setStatus("ended", "reconnect failed")
    );
    socket.on("convo_auth_expired", () => {
      socket.disconnect();
      this.connect();
    });
    socket.on("convo_loaded_more_inbox", (data: any) => this.onInbox(data));
    socket.on("convo_receivemessage", (data: any) => this.receive(data, true));
    socket.on("convo_receivemessage_bulk", (data: any) => {
      if (!Array.isArray(data)) return;
      const parties = new Set<number>();
      const groups = new Set<number>();
      for (const raw of data) {
        const message = this.add(raw);
        if (message) (message.group ? groups : parties).add(message.partyId);
      }
      parties.forEach((partyId) => this.fire("messages", partyId, false));
      groups.forEach((gid) => this.fire("groupMessages", gid, false));
    });
    socket.on("convo_read_notice", (data: any) => {
      const conversation = this.conversations.get(toInt(data?.partyID));
      if (conversation && conversation.unread) {
        conversation.unread = 0;
        this.fire("conversations");
      }
    });
    socket.on("type_notice_add", (data: any) => {
      const uid = toInt(data?.uid);
      if (!uid || uid === this.me?.uid) return;
      // Someone typing is active right now
      const user = this.users.get(uid);
      if (user) user.lastActive = Math.floor(Date.now() / 1000);
      this.fire("typing", uid, true);
    });
    socket.on("type_notice_remove", (data: any) => {
      const uid = toInt(data?.uid);
      if (uid) this.fire("typing", uid, false);
    });
    socket.on("convo_error", (data: any) => {
      this.fire("error", String(data?.error || "Convo failed."));
    });
  }

  private async onReady(data: any): Promise<void> {
    const me = parseUser(data?.user);
    if (!me) {
      // The API changed: stop rather than guess
      this.socket.disconnect();
      this.setStatus("ended", "unexpected convo_ready payload");
      return;
    }
    this.updateUser(data.user);
    this.me = this.users.get(me.uid) ?? me;
    try {
      const joined = await this.socket.emitWithAck("convo_join", {
        publicRoom: false,
      });
      if (!joined?.ok) throw new Error(joined?.error || "convo_join failed");
    } catch (error: any) {
      this.setStatus("disconnected", error?.message);
      return;
    }
    this.typingParty = "";
    this.setStatus("ready");
    this.loadInbox(0);
  }

  private onInbox(data: any): void {
    if (!this.me || !data || typeof data.messages !== "object") return;
    for (const raw of Object.values<any>(data.users ?? {})) {
      this.updateUser(raw);
    }
    for (const row of Object.values<any>(data.messages ?? {})) {
      const partyId = toInt(row?.party_id);
      const uids = partyUids(row?.party_data?.party);
      if (partyId <= 0 || uids.length !== 2) continue;
      const other = this.users.get(
        uids.find((uid) => uid !== this.me!.uid) ?? 0
      );
      if (!other) continue;
      const fromUid = toInt(row.from_uid);
      const lastMessage = parseMessage({
        ...row,
        uid: fromUid,
        party_id: partyId,
      });
      const existing = this.conversations.get(partyId);
      const dateline = toInt(row.dateline);
      if (existing && existing.dateline > dateline) continue;
      this.conversations.set(partyId, {
        partyId,
        other,
        lastMessage: lastMessage ?? undefined,
        dateline,
        unread:
          existing?.unread ||
          (fromUid !== this.me.uid && toInt(row.unread) > 0 ? 1 : 0),
      });
    }
    this.fire("conversations");
  }

  /**
   * Store a user from a server payload. The same object is kept per uid (so
   * conversations see updates), and last-active times only move forward.
   */
  private updateUser(raw: any): void {
    const user = parseUser(raw);
    if (!user) return;
    const existing = this.users.get(user.uid);
    if (!existing) {
      this.users.set(user.uid, user);
      return;
    }
    existing.username = user.username;
    existing.avatar = user.avatar;
    existing.group = user.group || existing.group;
    existing.lastActive = Math.max(existing.lastActive, user.lastActive);
  }

  private receive(raw: any, live: boolean): void {
    const message = this.add(raw);
    if (!message) return;
    this.fire(
      message.group ? "groupMessages" : "messages",
      message.partyId,
      live
    );
  }

  /** Store a message (deduped by kind:party:mid) and update its conversation. */
  private add(raw: any): ChatMessage | null {
    const message = parseMessage(raw);
    if (!message || !message.mid) return null;
    const key = `${message.group ? "group" : "private"}:${message.partyId}:${message.mid}`;
    if (this.seen.has(key)) return null;
    this.seen.add(key);
    if (this.seen.size > SEEN_LIMIT)
      this.seen.delete(this.seen.values().next().value!);

    for (const user of Object.values<any>(raw.users ?? {})) {
      this.updateUser(user);
    }
    // Sending a message means the sender was active then
    const sender = this.users.get(message.uid);
    if (sender) {
      sender.lastActive = Math.max(sender.lastActive, message.dateline);
    }

    const store = message.group ? this.groupMessages : this.messages;
    const list = store.get(message.partyId) ?? [];
    // Usually appended in order; insert in place for older pages
    let index = list.length;
    while (index > 0 && list[index - 1].mid > message.mid) index--;
    list.splice(index, 0, message);
    store.set(message.partyId, list);

    if (message.group) this.updateGroup(message, raw);
    else this.updateConversation(message, raw);
    return message;
  }

  private updateGroup(message: ChatMessage, raw: any): void {
    let group = this.groups.get(message.partyId);
    if (!group) {
      // A message from a group we didn't know about: the user is in it
      group = {
        gid: message.partyId,
        name: `Group ${message.partyId}`,
        dateline: 0,
        unread: 0,
        members: new Set(),
      };
      this.groups.set(message.partyId, group);
    }
    for (const uid of Object.keys(raw.users ?? {})) {
      if (toInt(uid)) group.members.add(toInt(uid));
    }
    if (message.dateline < group.dateline) return;
    group.lastMessage = message;
    group.dateline = message.dateline;
    if (!message.quiet && !raw.history && message.uid !== this.me?.uid) {
      group.unread++;
    }
    this.fire("groups");
  }

  private updateConversation(message: ChatMessage, raw: any): void {
    if (!this.me) return;
    let conversation = this.conversations.get(message.partyId);
    if (!conversation) {
      const uids = partyUids(raw.party?.party);
      if (uids.length !== 2) return;
      const other = this.users.get(
        uids.find((uid) => uid !== this.me!.uid) ?? 0
      );
      if (!other) return;
      conversation = {
        partyId: message.partyId,
        other,
        dateline: 0,
        unread: 0,
      };
      this.conversations.set(message.partyId, conversation);
    }
    if (message.dateline < conversation.dateline) return;
    conversation.lastMessage = message;
    conversation.dateline = message.dateline;
    // History pages repeat old messages; only live ones from the other user count as unread
    if (
      !raw.history &&
      raw.noSound === undefined &&
      message.uid !== this.me.uid
    ) {
      conversation.unread++;
    }
    this.fire("conversations");
  }

  private setStatus(status: ConvoStatus, reason?: string): void {
    this.status = status;
    this.fire("status", status, reason);
  }

  private fire(event: keyof ConvoClientEvents, ...args: unknown[]): void {
    for (const listener of Array.from(this.listeners.get(event) ?? [])) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`[GES] Convo chat ${event} listener failed`, error);
      }
    }
  }
}
