import {
  ChatImage,
  ChatUser,
  ConvoStatus,
  convoSocketUrl,
  fetchConvoTicket,
  HELPBOT_UID,
  parseUser,
  toInt,
} from "./ConvoClient";
import { LinkPreviews, parsePreviews } from "./formatMessage";
import { SocketIOClient } from "./SocketIOClient";

/**
 * Client for Convo's global (public) room, on its own socket so that joining
 * the room stays separate from the user's DMs: connect only while the global
 * chat window is open, as convo.php?action=all does.
 *
 * Protocol notes (verified 2026-10-20, see #393):
 * - The room is party -1, joined with `convo_join {publicRoom:true}`.
 * - On join the server sends `convo_group_level`, `convo_group_count {count, users}`
 *   and the latest 20 messages as `convo_receivemessage_bulk`. Older messages
 *   can't be loaded ("You do not belong to this conversation").
 * - Message ids restart when the server does, so messages carry a `bootId`.
 * - Messages are sent with `convo_newmessage {partyID: -1}`; HF turns text
 *   starting with "/" into commands (e.g. /flip wagers Bytes), which this
 *   client refuses to send.
 */

export const GLOBAL_PARTY = -1;
const SEND_TIMEOUT = 20000;
const MESSAGE_LIMIT = 300;
const TYPING_TIMEOUT = 35000;
const SEEN_LIMIT = 5000;

export interface RoomMessage {
  /** Unique across server restarts: `bootId:mid`. */
  key: string;
  mid: number;
  uid: number;
  text: string;
  dateline: number;
  image?: ChatImage;
  /** Helpbot HTML the server marked as trusted; render with renderTrustedHtml. */
  html?: boolean;
  requestId?: string;
  /** The server sent it with noSound (history, system notices): HF plays no sound for it. */
  quiet?: boolean;
  /** HF's previews of HF links in the text (mentions are profile links). */
  previews?: LinkPreviews;
}

export interface RoomUser extends ChatUser {
  /** HF's online-list rank, 1 (Administrator) to 8; see RANK_NAMES. */
  rank: number;
}

/** HF's online-list sections, in order (convo_1d.js rankDetails). */
export const RANK_NAMES: Record<number, string> = {
  1: "Administrator",
  2: "Staff",
  3: "Moderator",
  4: "Ub3r",
  5: "L33t",
  6: "Registered",
  7: "Banned",
  8: "Closed",
};

// Usergroup → rank (convo_1d.js rankPlacement)
const GROUP_RANKS: Record<number, number> = {
  4: 1,
  3: 2,
  28: 4,
  9: 5,
  2: 6,
  7: 7,
};

/** A user's online-list rank, the way HF's own client works it out. */
export function rankOf(raw: any): number {
  const usergroup = toInt(raw?.usergroup);
  if (usergroup === 3 || usergroup === 4) return GROUP_RANKS[usergroup];
  if (toInt(raw?.level) > 0) return 3;
  return GROUP_RANKS[usergroup] ?? 6;
}

/** Normalize a global room message. Null for anything else. */
export function parseRoomMessage(raw: any): RoomMessage | null {
  if (!raw || typeof raw.message !== "string") return null;
  if (toInt(raw.party_id) !== GLOBAL_PARTY || raw.is_group) return null;
  const mid = toInt(raw.mid);
  if (!mid) return null;
  const message: RoomMessage = {
    key: `${String(raw.bootId ?? "")}:${mid}`,
    mid,
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
  const previews = parsePreviews(raw.extra);
  if (previews) message.previews = previews;
  return message;
}

/** Whether a message would be run as an HF Convo command (/flip, /rain, …). */
export function isCommand(text: string): boolean {
  return text.trim().startsWith("/");
}

export interface GlobalRoomEvents {
  status: (status: ConvoStatus, reason?: string) => void;
  /** New messages were added; `reset` means the room restarted and earlier ones are gone. */
  messages: (added: RoomMessage[], reset: boolean) => void;
  online: () => void;
  typing: () => void;
  error: (message: string) => void;
}

export interface GlobalRoomClientOptions {
  postKey: string;
  origin?: string;
  createSocket?: (
    auth: () => Promise<Record<string, unknown>>
  ) => SocketIOClient;
  fetch?: typeof fetch;
  randomUUID?: () => string;
}

export class GlobalRoomClient {
  me: ChatUser | null = null;
  status: ConvoStatus = "connecting";
  /** Latest known users by uid (senders and the online list). */
  readonly users = new Map<number, ChatUser>();
  /** Messages since joining, oldest first (capped). */
  messages: RoomMessage[] = [];
  /** Who's in the room, sorted like HF's online list. */
  online: RoomUser[] = [];
  onlineCount = 0;
  /** Users typing right now. */
  readonly typing = new Map<number, string>();
  private readonly typingTimers = new Map<
    number,
    ReturnType<typeof setTimeout>
  >();
  private readonly seen = new Set<string>();
  private readonly listeners = new Map<string, Set<(...args: any[]) => void>>();
  private readonly socket: SocketIOClient;
  private readonly randomUUID: () => string;
  private bootId: string | null = null;
  private sending = false;
  private ownTyping = false;

  constructor(options: GlobalRoomClientOptions) {
    const origin = options.origin ?? location.origin;
    const fetchFn = options.fetch ?? ((...args) => fetch(...args));
    this.randomUUID = options.randomUUID ?? (() => crypto.randomUUID());
    const auth = async () => ({
      ticket: await fetchConvoTicket(origin, options.postKey, fetchFn),
    });
    this.socket = options.createSocket
      ? options.createSocket(auth)
      : new SocketIOClient({ url: convoSocketUrl(origin), auth });
    this.bindSocket();
  }

  on<K extends keyof GlobalRoomEvents>(
    event: K,
    listener: GlobalRoomEvents[K]
  ): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return this;
  }

  connect(): void {
    this.setStatus("connecting");
    this.socket.connect();
  }

  /** Leave the room: disconnecting is what takes the user off its online list. */
  disconnect(): void {
    this.socket.disconnect();
    this.clearTyping();
  }

  get isSending(): boolean {
    return this.sending;
  }

  createRequestId(): string {
    return this.randomUUID();
  }

  /** Send a message to the room. One pending send at a time, as HF allows. */
  async send(text: string, requestId = this.createRequestId()): Promise<void> {
    const message = text.trim();
    if (!message) throw new Error("Message is empty.");
    if (isCommand(message)) {
      throw new Error(
        "Commands like /flip only work on convo.php. Your message was not sent."
      );
    }
    await this.mutate("convo_newmessage", {
      partyID: GLOBAL_PARTY,
      message,
      requestId,
    });
  }

  /** Upload an image (PNG, JPG or GIF bytes) to the room, as HF's paste and drop do. */
  async sendImage(
    imageData: ArrayBuffer,
    requestId = this.createRequestId()
  ): Promise<void> {
    await this.mutate("convo_imageupload", {
      partyID: GLOBAL_PARTY,
      imageData,
      requestId,
    });
  }

  /** Send something to the room, waiting for the server's ack. One at a time. */
  private async mutate(
    event: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (this.sending)
      throw new Error("Please wait for the pending send to finish.");
    if (!this.socket.connected || this.status !== "ready") {
      throw new Error(
        "Global chat is disconnected. Your message was not sent."
      );
    }
    this.sending = true;
    try {
      const result = await this.socket
        .emitWithAck(event, data, SEND_TIMEOUT)
        .catch((error: Error) => {
          throw new Error(
            error.message === "Timed out waiting for a reply." ||
              error.message === "Disconnected."
              ? "Delivery is unconfirmed. Check the room before resending."
              : error.message
          );
        });
      if (!result?.ok)
        throw new Error(result?.error || "Convo request failed.");
      this.setTyping(false);
    } finally {
      this.sending = false;
    }
  }

  /** Tell the room we're typing. This socket is only in the global room, so notices can't leak into DMs. */
  setTyping(typing: boolean): void {
    if (typing === this.ownTyping || this.status !== "ready") return;
    this.ownTyping = typing;
    this.socket.emit(typing ? "type_notice_start" : "type_notice_stop", true);
  }

  private bindSocket(): void {
    const socket = this.socket;
    socket.on("convo_ready", (data: any) => this.onReady(data));
    socket.on("disconnect", (reason: string) => {
      this.ownTyping = false;
      this.clearTyping();
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
    socket.on("convo_group_count", (data: any) => this.onOnline(data));
    socket.on("convo_receivemessage", (data: any) => this.receive([data]));
    socket.on("convo_receivemessage_bulk", (data: any) => {
      if (Array.isArray(data)) this.receive(data);
    });
    socket.on("type_notice_add", (data: any) => {
      const uid = toInt(data?.uid);
      if (!uid || uid === this.me?.uid || typeof data?.username !== "string")
        return;
      clearTimeout(this.typingTimers.get(uid));
      this.typing.set(uid, data.username);
      // Typing notices can be missed; don't show one forever
      this.typingTimers.set(
        uid,
        setTimeout(() => this.stopTyping(uid), TYPING_TIMEOUT)
      );
      this.fire("typing");
    });
    socket.on("type_notice_remove", (data: any) =>
      this.stopTyping(toInt(data?.uid))
    );
    socket.on("convo_error", (data: any) => {
      this.fire("error", String(data?.error || "Convo failed."));
    });
  }

  private async onReady(data: any): Promise<void> {
    const me = parseUser(data?.user);
    if (!me) {
      this.socket.disconnect();
      this.setStatus("ended", "unexpected convo_ready payload");
      return;
    }
    this.me = me;
    // A new boot means the room's message ids started over
    const bootId = data?.bootId == null ? null : String(data.bootId);
    if (this.bootId !== null && bootId !== this.bootId) {
      this.messages = [];
      this.seen.clear();
      this.fire("messages", [], true);
    }
    this.bootId = bootId;
    try {
      const joined = await this.socket.emitWithAck("convo_join", {
        publicRoom: true,
      });
      if (!joined?.ok) throw new Error(joined?.error || "convo_join failed");
    } catch (error: any) {
      this.setStatus("disconnected", error?.message);
      return;
    }
    this.ownTyping = false;
    this.setStatus("ready");
  }

  private onOnline(data: any): void {
    const users = Object.values<any>(data?.users ?? {});
    this.online = users
      .map((raw) => {
        const user = parseUser(raw);
        return user ? { ...user, rank: rankOf(raw) } : null;
      })
      .filter((user): user is RoomUser => user !== null)
      .sort(
        (a, b) =>
          a.rank - b.rank ||
          a.username.toLowerCase().localeCompare(b.username.toLowerCase())
      );
    this.online.forEach((user) => this.users.set(user.uid, user));
    this.onlineCount = toInt(data?.count) || this.online.length;
    this.fire("online");
  }

  private receive(raws: any[]): void {
    const added: RoomMessage[] = [];
    for (const raw of raws) {
      const message = parseRoomMessage(raw);
      if (!message || this.seen.has(message.key)) continue;
      this.seen.add(message.key);
      if (this.seen.size > SEEN_LIMIT) {
        this.seen.delete(this.seen.values().next().value!);
      }
      for (const rawUser of Object.values<any>(raw.users ?? {})) {
        const user = parseUser(rawUser);
        if (user) this.users.set(user.uid, user);
      }
      // A message from them ends their typing notice
      if (this.typing.has(message.uid)) this.stopTyping(message.uid);
      added.push(message);
    }
    if (!added.length) return;
    this.messages.push(...added);
    if (this.messages.length > MESSAGE_LIMIT) {
      this.messages.splice(0, this.messages.length - MESSAGE_LIMIT);
    }
    this.fire("messages", added, false);
  }

  private stopTyping(uid: number): void {
    if (!this.typing.has(uid)) return;
    clearTimeout(this.typingTimers.get(uid));
    this.typingTimers.delete(uid);
    this.typing.delete(uid);
    this.fire("typing");
  }

  private clearTyping(): void {
    if (!this.typing.size) return;
    this.typingTimers.forEach((timer) => clearTimeout(timer));
    this.typingTimers.clear();
    this.typing.clear();
    this.fire("typing");
  }

  private setStatus(status: ConvoStatus, reason?: string): void {
    this.status = status;
    this.fire("status", status, reason);
  }

  private fire(event: keyof GlobalRoomEvents, ...args: unknown[]): void {
    for (const listener of Array.from(this.listeners.get(event) ?? [])) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`[GES] Global chat ${event} listener failed`, error);
      }
    }
  }
}
