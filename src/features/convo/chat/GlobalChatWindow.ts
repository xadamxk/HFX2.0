import { el } from "../../../core/Dom";
import type { ConvoStatus } from "./ConvoClient";
import {
  GLOBAL_PARTY,
  GlobalRoomClient,
  RANK_NAMES,
  RoomMessage,
  RoomUser,
} from "./GlobalRoomClient";
import { RoomChatWindow, RoomWindowOptions } from "./RoomChatWindow";
import { MessageSoundPlayer, mutedParties } from "./sound";

export { groupTime, typingText } from "./RoomChatWindow";

/**
 * The global (public) room's window. Its socket is only connected while the
 * window is open and expanded, so the user only shows in the room's online
 * list while they're looking.
 */

export interface GlobalChatWindowOptions extends RoomWindowOptions {
  postKey: string;
  createClient?: () => GlobalRoomClient;
  /** Plays HF's sound for new messages that mention the user. */
  sound?: MessageSoundPlayer;
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

export class GlobalChatWindow extends RoomChatWindow {
  readonly partyId = GLOBAL_PARTY;
  readonly client: GlobalRoomClient;
  private readonly onlineButton: HTMLButtonElement;
  private readonly sound?: MessageSoundPlayer;

  constructor(options: GlobalChatWindowOptions) {
    const origin = options.origin ?? location.origin;
    const client =
      options.createClient?.() ??
      new GlobalRoomClient({ postKey: options.postKey, origin });
    const onlineButton = el(
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
    super(client, options, {
      partyAttr: String(GLOBAL_PARTY),
      title: "Global chat",
      href: `${origin}/convo.php?action=all`,
      icon: GLOBE_ICON,
      placeholder: "Message global chat",
      historyNote: "Recent messages since the room last restarted",
      headerExtras: [onlineButton],
    });
    this.client = client;
    this.onlineButton = onlineButton;
    this.sound = options.sound;

    onlineButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (this.togglePanel()) this.renderOnline();
    });
    client.on("status", (status: ConvoStatus) => {
      if (status !== "ready") onlineButton.hidden = true;
    });
    client.on("online", () => {
      onlineButton.hidden = false;
      onlineButton.textContent = `${client.onlineCount} online`;
      if (!this.panel.hidden) this.renderOnline();
    });
    if (!this.minimized) client.connect();
  }

  /** Leave the room by disconnecting. */
  destroy(): void {
    super.destroy();
    this.client.disconnect();
  }

  /** Minimizing leaves the room; expanding rejoins it. */
  protected onMinimizedChange(minimized: boolean): void {
    if (minimized) this.client.disconnect();
    else this.client.connect();
  }

  protected statusText(status: ConvoStatus): string {
    return status === "connecting" ? "Joining…" : super.statusText(status);
  }

  protected onPanelToggle(open: boolean): void {
    this.onlineButton.setAttribute("aria-expanded", String(open));
  }

  /** Who's in the room, in HF's rank sections. */
  private renderOnline(): void {
    const sections: { label: string; users: RoomUser[] }[] = [];
    for (const user of this.client.online) {
      const label = RANK_NAMES[user.rank] ?? "Other";
      if (sections[sections.length - 1]?.label !== label)
        sections.push({ label, users: [] });
      sections[sections.length - 1].users.push(user);
    }
    this.renderPeople(`${this.client.onlineCount} online`, sections);
  }

  /**
   * The room is busy, so only mentions make a sound: new ones (history comes
   * marked noSound), unless the room is muted on convo.php or being looked at.
   */
  protected onNewMessage(message: RoomMessage, mentionsMe: boolean): void {
    if (!this.sound || !mentionsMe || message.quiet) return;
    if (mutedParties().has(GLOBAL_PARTY) || this.isActive()) return;
    this.sound.play(`global:${message.key}`);
  }
}
