import { Checkbox } from "../../configuration/configurables/Checkbox";
import { RadioGroup } from "../../configuration/configurables/RadioGroup";
import { Stepper } from "../../configuration/configurables/Stepper";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { SectionArray } from "../../core/SectionArray";
import { Util } from "../../core/Util";
import Convo from "../../sections/Convo";
import Global from "../../sections/Global";
import { ChatDock, DEFAULT_DOCK_STATE, DockState } from "./chat/ChatDock";
import { ConvoClient } from "./chat/ConvoClient";
import { interceptConvoLinks, pageUserHint } from "./chat/convoLinks";
import { fetchGroupList, GroupInfo } from "./chat/groupList";
import { GlobalChatWindow } from "./chat/GlobalChatWindow";
import { MessageSound } from "./chat/sound";
import { CHAT_DOCK_CSS } from "./chat/styles";
import MessageTimestamps from "./MessageTimestamps";
import WhosOnlineSorting from "../global/WhosOnlineSorting";

interface ChatBubblesSettings {
  enabled: boolean;
  maxBubbles: number;
  typingIndicators: boolean;
  globalChat: boolean;
  sound: boolean;
  side: "left" | "right";
  layout: "bubbles" | "list";
  groupChats: boolean;
  groupSound: "mentions" | "all";
  convoLinks: boolean;
  hideStanley: boolean;
  storage_dockState?: DockState;
  storage_groupList?: GroupListCache | null;
}

interface GroupListCache {
  groups: GroupInfo[];
}

const DOCK_STATE = "dockState";
const GROUP_LIST = "groupList";

class ChatBubbles extends Feature {
  constructor() {
    super({
      id: "ChatBubbles",
      section: Convo,
      // Runs on every page except convo.php, where HF's own client is open
      additionalSections: new SectionArray(Global),
      name: "Convo Anywhere",
      enabled: true,
      description:
        "Chat in Convo from anywhere. A Messenger-style dock for your conversations, group chats and the global chat, with online status, typing indicators, and all the features you love from Convo. Hidden on convo.php itself.",
      configurables: [
        new RadioGroup({
          id: "layout",
          label: "Layout",
          description:
            "Avatar bubbles, or a Messenger-style list of conversations with their latest message.",
          default: "bubbles",
          options: [
            { label: "Bubbles", value: "bubbles" },
            { label: "List", value: "list" },
          ],
        }),
        new RadioGroup({
          id: "side",
          label: "Dock side",
          description:
            "Which side of the page the chat bubbles or list and the chat windows sit on.",
          default: "right",
          options: [
            { label: "Right", value: "right" },
            { label: "Left", value: "left" },
          ],
        }),
        new Stepper({
          id: "maxBubbles",
          label: "Conversations to show",
          description:
            "The most conversations to show: up to 10 bubbles, or up to 20 in the list. Unread conversations are shown first.",
          step: 1,
          default: 5,
        }),
        new Checkbox({
          id: "typingIndicators",
          label: "Typing indicators",
          description:
            "Show when the other person is typing, and let them see when you are.",
          default: true,
        }),
        new Checkbox({
          id: "globalChat",
          label: "Global chat",
          description:
            "Add a Global chat entry for HF's public Convo room. You only join the room, and show in its online list, while its window is open.",
          default: true,
        }),
        new Checkbox({
          id: "hideStanley",
          label: "Hide Stanley in global chat",
          description:
            "Hide Stanley's automated notices (new threads and other alerts) from the global chat.",
          default: false,
        }),
        new Checkbox({
          id: "groupChats",
          label: "Group chats",
          description:
            "Include your private group convos (Comrades on convo.php) alongside your DMs.",
          default: true,
        }),
        new Checkbox({
          id: "convoLinks",
          label: "Open Convo links here",
          description:
            "HF's Convo buttons on profiles and posts open the chat here instead of on convo.php. Ctrl-click or middle-click still opens convo.php.",
          default: true,
        }),
        new Checkbox({
          id: "sound",
          label: "Message sound",
          description:
            "Play Convo's sound for new messages, and for global chat messages that mention you. Conversations muted on convo.php stay silent.",
          default: false,
        }),
        new RadioGroup({
          id: "groupSound",
          label: "Group chat sound",
          description:
            "With Message sound on: which new group chat messages play it.",
          default: "mentions",
          options: [
            { label: "Mentions only", value: "mentions" },
            { label: "Every message", value: "all" },
          ],
        }),
      ],
      storageItems: [
        {
          id: DOCK_STATE,
          description:
            "Which chat windows are open or minimized, and group chat activity (this browser only).",
          defaultValue: DEFAULT_DOCK_STATE,
        },
        {
          id: GROUP_LIST,
          description:
            "Your group chats, read once from convo.php (this browser only). Clear it to read them again.",
          defaultValue: null,
        },
      ],
    });
  }

  async run(settings: ChatBubblesSettings, section: Section) {
    if (section === Convo || window.top !== window) return;
    if (document.getElementById("hfx-chat-dock")) return;
    const postKey = Util.getUserPostKey();
    if (!postKey || !Util.getCurrentUser()) return;

    // Chat windows follow the Message Timestamps toggle
    const timestampSettings =
      await this.settingsService.getFeatureSettings(MessageTimestamps);
    const timestamps = timestampSettings?.enabled ?? MessageTimestamps.enabled;
    if (document.getElementById("hfx-chat-dock")) return;

    Util.addCssToPage(CHAT_DOCK_CSS);
    const client = new ConvoClient({ postKey });
    const sound = settings.sound ? new MessageSound() : undefined;
    const dock = new ChatDock({
      client,
      maxBubbles: Number(settings.maxBubbles) || 5,
      typingIndicators: settings.typingIndicators !== false,
      sound,
      groups:
        settings.groupChats !== false
          ? {
              list: () => this.groupList(settings.storage_groupList),
              mapNames: () => this.mapNames(),
              addToList: (group) => {
                this.addToGroupList(group);
              },
              sound: settings.groupSound === "all" ? "all" : "mentions",
            }
          : undefined,
      createGlobal:
        settings.globalChat !== false
          ? ({ minimized, onClose, onChange }) =>
              new GlobalChatWindow({
                postKey,
                minimized,
                typingIndicators: settings.typingIndicators !== false,
                sound,
                hideHelpbot: settings.hideStanley === true,
                onClose,
                onChange,
              })
          : undefined,
      side: settings.side === "left" ? "left" : "right",
      layout: settings.layout === "list" ? "list" : "bubbles",
      timestamps: Boolean(timestamps),
      state: settings.storage_dockState ?? DEFAULT_DOCK_STATE,
      saveState: (state) => {
        this.settingsService
          .setStorageItem(this, DOCK_STATE, state)
          .catch((error) =>
            this.logger.error(
              `Couldn't save chat state: ${error?.message}`,
              error
            )
          );
      },
      onEnded: (reason) => {
        client.disconnect();
        this.logger.error(
          `Convo chat stopped (${reason ?? "unknown reason"}); the dock is hidden until the next page load.`
        );
      },
    });
    dock.mount();
    client.connect();
    if (settings.convoLinks !== false) {
      const origin = location.origin;
      interceptConvoLinks(
        (uid) => dock.openChatWithUser(uid, pageUserHint(uid, origin)),
        origin
      );
    }
    window.addEventListener("pagehide", () => client.disconnect());
  }

  /**
   * The user's groups: the cached list, or (only when there's none) the
   * Comrades list read once from convo.php and cached until cleared.
   */
  private async groupList(
    cached: GroupListCache | null | undefined
  ): Promise<GroupInfo[]> {
    if (cached && Array.isArray(cached.groups)) return cached.groups;
    const groups = await fetchGroupList();
    await this.saveGroupList(groups.map(({ gid, name }) => ({ gid, name })));
    return groups;
  }

  /** Add a group found through a message to the cached list. */
  private async addToGroupList(group: GroupInfo): Promise<void> {
    const cached = (await this.settingsService.getStorageItem(
      this,
      GROUP_LIST
    )) as GroupListCache | null;
    const groups = cached?.groups ?? [];
    if (groups.some((existing) => existing.gid === group.gid)) return;
    await this.saveGroupList([...groups, { gid: group.gid, name: group.name }]);
  }

  private saveGroupList(groups: GroupInfo[]): Promise<void> {
    return this.settingsService
      .setStorageItem(this, GROUP_LIST, { groups })
      .catch((error) =>
        this.logger.error(`Couldn't save group list: ${error?.message}`, error)
      );
  }

  /**
   * Group names by id from the group map Who's Online Sorting keeps (from
   * showgroups.php). Read only: Convo Anywhere never fetches it.
   */
  private async mapNames(): Promise<Record<number, string>> {
    const map = ((await this.settingsService.getStorageItem(
      WhosOnlineSorting,
      "groupMap"
    )) ?? {}) as Record<string, string>;
    const names: Record<number, string> = {};
    for (const [className, name] of Object.entries(map)) {
      const gid = parseInt(className.match(/^group(\d+)$/)?.[1] ?? "", 10);
      if (gid && typeof name === "string") names[gid] = name;
    }
    return names;
  }
}

export default new ChatBubbles();
