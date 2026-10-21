import { Checkbox } from "../../configuration/configurables/Checkbox";
import { RadioGroup } from "../../configuration/configurables/RadioGroup";
import { Stepper } from "../../configuration/configurables/Stepper";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { SectionArray } from "../../core/SectionArray";
import { Util } from "../../core/Util";
import { GROUP_MAP_TTL, groupIdOf, resolveGroupMap } from "../../core/GroupMap";
import Convo from "../../sections/Convo";
import Global from "../../sections/Global";
import { ChatDock, DEFAULT_DOCK_STATE, DockState } from "./chat/ChatDock";
import { ConvoClient } from "./chat/ConvoClient";
import { GlobalChatWindow } from "./chat/GlobalChatWindow";
import { MessageSound } from "./chat/sound";
import { CHAT_DOCK_CSS } from "./chat/styles";
import MessageTimestamps from "./MessageTimestamps";
import WhosOnlineSorting, {
  STORAGE_KEYS as GROUP_MAP_KEYS,
} from "../global/WhosOnlineSorting";

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
  storage_dockState?: DockState;
  storage_groupMembers?: GroupMembers | null;
}

interface GroupMembers {
  gids: number[];
  checkedAt: number;
}

const DOCK_STATE = "dockState";
const GROUP_MEMBERS = "groupMembers";

class ChatBubbles extends Feature {
  constructor() {
    super({
      id: "ChatBubbles",
      section: Convo,
      // Runs on every page except convo.php, where HF's own client is open
      additionalSections: new SectionArray(Global),
      name: "Chat Bubbles",
      enabled: true,
      description:
        "Chat from any page: avatar bubbles or a conversation list (bottom corner) for recent and unread Convo conversations open small chat windows. A dot on each avatar shows the user's status (green online, yellow away, gray offline) and animates while they type.",
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
          id: "groupChats",
          label: "Group chats",
          description:
            "Include your private group convos (Comrades on convo.php) alongside your DMs.",
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
          id: GROUP_MEMBERS,
          description:
            "Which group chats you're in, rechecked daily (this browser only).",
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
              names: () => this.groupNames(),
              members: freshMembers(settings.storage_groupMembers),
              saveMembers: (gids) => {
                this.settingsService
                  .setStorageItem(this, GROUP_MEMBERS, {
                    gids,
                    checkedAt: Date.now(),
                  })
                  .catch(() => undefined);
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
    window.addEventListener("pagehide", () => client.disconnect());
  }

  /**
   * Group names by id. Uses the group map WhosOnlineSorting keeps (from
   * showgroups.php), fetching and storing it there when it's missing or stale.
   */
  private async groupNames(): Promise<Record<number, string>> {
    const storage = this.settingsService;
    const map = await resolveGroupMap({
      stored: await storage.getStorageItem(
        WhosOnlineSorting,
        GROUP_MAP_KEYS.GROUP_MAP
      ),
      nextFetch:
        Number(
          await storage.getStorageItem(
            WhosOnlineSorting,
            GROUP_MAP_KEYS.NEXT_FETCH
          )
        ) || 0,
      save: async (fetched, nextFetch) => {
        if (fetched) {
          await storage.setStorageItem(
            WhosOnlineSorting,
            GROUP_MAP_KEYS.GROUP_MAP,
            fetched
          );
        }
        await storage.setStorageItem(
          WhosOnlineSorting,
          GROUP_MAP_KEYS.NEXT_FETCH,
          nextFetch
        );
      },
    });
    const names: Record<number, string> = {};
    for (const [className, name] of Object.entries(map ?? {})) {
      const gid = groupIdOf(className);
      if (gid) names[gid] = name;
    }
    return names;
  }
}

/** The cached group membership while it's under a day old, else null (check again). */
function freshMembers(
  cached: GroupMembers | null | undefined
): number[] | null {
  if (!cached || !Array.isArray(cached.gids)) return null;
  return Date.now() - Number(cached.checkedAt) < GROUP_MAP_TTL
    ? cached.gids
    : null;
}

export default new ChatBubbles();
