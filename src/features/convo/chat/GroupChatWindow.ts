import { Logger } from "../../../core/Logger";
import { el } from "../../../core/Dom";
import type {
  ChatMessage,
  ChatUser,
  ConvoClient,
  ConvoClientEvents,
  ConvoStatus,
} from "./ConvoClient";
import { HISTORY_PAGE_SIZE } from "./ConvoClient";
import type { RoomMessage } from "./GlobalRoomClient";
import {
  RoomChatWindow,
  RoomSource,
  RoomWindowOptions,
} from "./RoomChatWindow";

/**
 * Private group convos ("Comrades" on convo.php). They share the DM socket
 * (ConvoClient); GroupRoom presents one group the way the global room does, so
 * the window can reuse the grouped room layout.
 */

const TYPING_TIMEOUT = 35000;

export const GROUP_ICON = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of [
    "M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7z",
    "M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5",
    "M16 4.3a3.5 3.5 0 0 1 0 6.4M17.5 14.7c2.4.6 4 2.6 4 5.3",
  ]) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
};

const toRoomMessage = (gid: number, message: ChatMessage): RoomMessage => ({
  key: `${gid}:${message.mid}`,
  mid: message.mid,
  uid: message.uid,
  text: message.text,
  dateline: message.dateline,
  image: message.image,
  html: message.html,
  requestId: message.requestId,
  quiet: message.quiet,
  previews: message.previews,
  embed: message.embed,
});

/** One group convo, read from and sent through the shared ConvoClient. */
export class GroupRoom implements RoomSource {
  messages: RoomMessage[] = [];
  readonly typing = new Map<number, string>();
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly listeners = new Map<string, Set<(...args: any[]) => void>>();
  private readonly unsubscribe: (() => void)[] = [];

  constructor(
    private readonly client: ConvoClient,
    readonly gid: number
  ) {
    this.listen("groupMessages", (gid, live) => {
      if (gid === this.gid) this.sync(live);
    });
    this.listen("status", (status) => this.fire("status", status));
    this.listen("error", (message) => this.fire("error", message));
    this.listen("typing", (uid, typing) => this.onTyping(uid, typing));
    this.sync(false);
  }

  get me(): ChatUser | null {
    return this.client.me;
  }
  get users(): Map<number, ChatUser> {
    return this.client.users;
  }
  get status(): ConvoStatus {
    return this.client.status;
  }
  get isSending(): boolean {
    return this.client.isSending;
  }

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return this;
  }

  createRequestId(): string {
    return this.client.createRequestId();
  }

  send(text: string, requestId: string): Promise<unknown> {
    return this.client.sendGroup(this.gid, text, requestId);
  }

  setTyping(typing: boolean): void {
    this.client.setGroupTyping(this.gid, typing);
  }

  load(): Promise<void> {
    return this.client.loadGroupHistory(this.gid);
  }

  loadOlder(): Promise<boolean> {
    return this.client.loadOlderGroup(this.gid);
  }

  /** Members seen in loaded messages, by name. HF sends no member list for groups. */
  members(): ChatUser[] {
    const group = this.client.groups.get(this.gid);
    return Array.from(group?.members ?? [])
      .map((uid) => this.client.users.get(uid))
      .filter((user): user is ChatUser => !!user)
      .sort((a, b) =>
        a.username.toLowerCase().localeCompare(b.username.toLowerCase())
      );
  }

  destroy(): void {
    this.unsubscribe.forEach((off) => off());
    this.timers.forEach((timer) => clearTimeout(timer));
  }

  private listen<K extends keyof ConvoClientEvents>(
    event: K,
    listener: ConvoClientEvents[K]
  ): void {
    this.client.on(event, listener);
    this.unsubscribe.push(() => this.client.off(event, listener));
  }

  /** Mirror the client's messages for this group and pass on the new ones. */
  private sync(_live: boolean): void {
    const known = new Set(this.messages.map((message) => message.key));
    this.messages = this.client
      .getGroupMessages(this.gid)
      .map((message) => toRoomMessage(this.gid, message));
    const added = this.messages.filter((message) => !known.has(message.key));
    for (const message of added) {
      if (this.typing.has(message.uid)) this.stopTyping(message.uid);
    }
    if (added.length) this.fire("messages", added, false);
  }

  /**
   * Typing notices carry no party id: show one here only for a member of this
   * group, and only while this group is the chat the server last loaded.
   */
  private onTyping(uid: number, typing: boolean): void {
    if (!typing) {
      this.stopTyping(uid);
      return;
    }
    const member = this.client.groups.get(this.gid)?.members.has(uid);
    const user = this.client.users.get(uid);
    if (!member || !user || !this.client.isLastLoaded(true, this.gid)) return;
    clearTimeout(this.timers.get(uid));
    this.typing.set(uid, user.username);
    this.timers.set(
      uid,
      setTimeout(() => this.stopTyping(uid), TYPING_TIMEOUT)
    );
    this.fire("typing");
  }

  private stopTyping(uid: number): void {
    if (!this.typing.has(uid)) return;
    clearTimeout(this.timers.get(uid));
    this.timers.delete(uid);
    this.typing.delete(uid);
    this.fire("typing");
  }

  private fire(event: string, ...args: unknown[]): void {
    for (const listener of Array.from(this.listeners.get(event) ?? [])) {
      try {
        listener(...args);
      } catch (error) {
        Logger.error(`Group chat ${event} listener failed`, error);
      }
    }
  }
}

export interface GroupChatWindowOptions extends RoomWindowOptions {
  client: ConvoClient;
  gid: number;
  name: string;
}

/** A private group convo window: the grouped room layout, with Load older and members. */
export class GroupChatWindow extends RoomChatWindow {
  readonly gid: number;
  readonly room: GroupRoom;
  private readonly client: ConvoClient;
  private readonly membersButton: HTMLButtonElement;
  private readonly olderButton: HTMLButtonElement;
  private loaded = false;
  private loading = false;
  private hasOlder = false;

  constructor(options: GroupChatWindowOptions) {
    const origin = options.origin ?? location.origin;
    const room = new GroupRoom(options.client, options.gid);
    const membersButton = el(
      "button",
      {
        type: "button",
        class: "hfx-gc-online-toggle",
        title: "Members seen in recent messages",
        "aria-expanded": "false",
      },
      "Members"
    );
    const olderButton = el(
      "button",
      { type: "button", class: "hfx-chat-older", hidden: true },
      "Load older messages"
    );
    super(room, options, {
      partyAttr: `g${options.gid}`,
      title: options.name,
      href: `${origin}/convo.php?action=group&gid=${options.gid}`,
      icon: GROUP_ICON,
      placeholder: `Message ${options.name}`,
      noImagesNotice: "Images can't be sent to group chats from HFX yet.",
      headerExtras: [membersButton],
      listTop: [olderButton],
    });
    this.gid = options.gid;
    this.room = room;
    this.client = options.client;
    this.membersButton = membersButton;
    this.olderButton = olderButton;
    this.root.dataset.kind = "group";
    this.root.classList.add("hfx-gc-group-window");

    membersButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (this.togglePanel()) this.renderMembers();
    });
    // Until the first load succeeds, the button retries it
    olderButton.addEventListener("click", () =>
      this.loaded ? this.loadOlder() : this.ensureLoaded()
    );
    this.list.addEventListener("scroll", () => {
      if (this.list.scrollTop < 40 && this.hasOlder) this.loadOlder();
    });
    // HF has no read receipts for groups; clear HFX's own unread count when looked at
    this.root.addEventListener("focusin", () =>
      this.client.markGroupRead(this.gid)
    );
    room.on("messages", () => {
      if (this.isActive()) this.client.markGroupRead(this.gid);
    });

    if (!this.minimized) this.ensureLoaded();
  }

  destroy(): void {
    super.destroy();
    this.room.destroy();
  }

  protected onMinimizedChange(minimized: boolean): void {
    if (!minimized) this.ensureLoaded();
  }

  protected onPanelToggle(open: boolean): void {
    this.membersButton.setAttribute("aria-expanded", String(open));
  }

  /** Members seen in loaded messages, other than you. */
  protected mentionCandidates(): ChatUser[] {
    const me = this.client.me?.uid;
    return this.room.members().filter((user) => user.uid !== me);
  }

  private renderMembers(): void {
    const members = this.room.members();
    this.renderPeople(`${members.length} members seen`, [{ users: members }]);
  }

  /** After a reconnect: load what was missed, or retry a first load that failed. */
  catchUp(): void {
    if (this.loaded) this.room.load().catch(() => undefined);
    else if (!this.minimized) this.ensureLoaded();
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded || this.loading) return;
    this.loading = true;
    this.status.textContent = "Loading…";
    this.olderButton.hidden = true;
    try {
      await this.room.load();
      this.loaded = true;
      this.hasOlder = this.room.messages.length >= HISTORY_PAGE_SIZE;
      this.olderButton.textContent = "Load older messages";
      this.olderButton.hidden = !this.hasOlder;
      this.status.textContent = "";
      this.scrollToBottom();
    } catch {
      this.status.textContent = "";
      this.olderButton.textContent = "Couldn't load messages. Retry";
      this.olderButton.hidden = false;
    } finally {
      this.loading = false;
    }
  }

  private async loadOlder(): Promise<void> {
    if (this.loading || !this.hasOlder) return;
    this.loading = true;
    this.olderButton.disabled = true;
    this.olderButton.textContent = "Loading…";
    try {
      this.hasOlder = await this.room.loadOlder();
    } catch {
      this.showNotice("Couldn't load older messages.");
    } finally {
      this.loading = false;
      this.olderButton.disabled = false;
      this.olderButton.textContent = "Load older messages";
      this.olderButton.hidden = !this.hasOlder;
    }
  }
}
