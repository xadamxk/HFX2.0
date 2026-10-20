import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Stepper } from "../../configuration/configurables/Stepper";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { SectionArray } from "../../core/SectionArray";
import { Util } from "../../core/Util";
import Convo from "../../sections/Convo";
import Global from "../../sections/Global";
import { ChatDock, DEFAULT_DOCK_STATE, DockState } from "./chat/ChatDock";
import { ConvoClient } from "./chat/ConvoClient";
import { CHAT_DOCK_CSS } from "./chat/styles";

interface ChatBubblesSettings {
  enabled: boolean;
  maxBubbles: number;
  typingIndicators: boolean;
  storage_dockState?: DockState;
}

const DOCK_STATE = "dockState";

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
        "Chat from any page: avatar bubbles (bottom right) for recent and unread Convo conversations open small chat windows.",
      configurables: [
        new Stepper({
          id: "maxBubbles",
          label: "Bubbles to show",
          description:
            "The most conversation bubbles to show (1-10). Unread conversations are shown first.",
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
      ],
      storageItems: [
        {
          id: DOCK_STATE,
          description:
            "Which chat windows are open or minimized (this browser only).",
          defaultValue: DEFAULT_DOCK_STATE,
        },
      ],
    });
  }

  run(settings: ChatBubblesSettings, section: Section) {
    if (section === Convo || window.top !== window) return;
    if (document.getElementById("hfx-chat-dock")) return;
    const postKey = Util.getUserPostKey();
    if (!postKey || !Util.getCurrentUser()) return;

    Util.addCssToPage(CHAT_DOCK_CSS);
    const client = new ConvoClient({ postKey });
    const dock = new ChatDock({
      client,
      maxBubbles: Number(settings.maxBubbles) || 5,
      typingIndicators: settings.typingIndicators !== false,
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
}

export default new ChatBubbles();
