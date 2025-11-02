import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Feature } from "../../core/Feature";
import Threads from "../../sections/Threads";

class PostAuthorIndicators extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Post Author Indicators",
      enabled: true,
      description:
        "Adds status indicators to profile icons. Green:Online, White:Offline, Yellow:Away, Blue:Viewing Thread",
      configurables: [
        new Checkbox({
          id: "roundProfileIcons",
          label: "Round Profile Icons",
          description: "Round the profile icons to a circle.",
          default: false,
        }),
        new Checkbox({
          id: "standardizeAvatarSize",
          label: "Standardize Avatar Size",
          description: "Standardize the avatar size to 100x100.",
          default: false,
        }),
      ],
    });
  }

  run(settings: any) {
    const roundProfileIcons: boolean = settings.roundProfileIcons;
    const standardizeAvatarSize: boolean = settings.standardizeAvatarSize;

    const posts = this.querySelectorAll(".post");
    if (!posts.length) return;

    posts.forEach((post) => {
      const authorInfo = post.querySelector(
        ".author_information"
      ) as HTMLElement | null;

      // Find status inside author_information only (robust against OP feather icon elsewhere)
      const buddyImg = authorInfo?.querySelector(
        "img.buddy_status"
      ) as HTMLImageElement | null;
      const titledEl =
        authorInfo?.querySelector("a[title], img[title]") || null;

      const avatarImage = post.querySelector(
        ".author_avatar > a > img"
      ) as HTMLImageElement | null;

      if (!avatarImage || (!buddyImg && !titledEl)) return;

      let statusTitle = "";
      if (buddyImg) {
        statusTitle = (
          buddyImg.getAttribute("alt") ||
          buddyImg.getAttribute("title") ||
          buddyImg.parentElement?.getAttribute("title") ||
          ""
        )
          .trim()
          .toLowerCase();
        buddyImg.remove(); // remove the buddy_status icon
      } else if (titledEl) {
        statusTitle = (titledEl.getAttribute("title") || "")
          .trim()
          .toLowerCase();
      }

      // TODO: If viewing thread - Possible colors (Blue: #4c79af, Red: #af504c, Light Blue: #4cabaf, Purple: #504caf, Violet: #814caf)
      // Get colors from color-wheel tool so the shades match: https://colordesigner.io/color-wheel
      if (statusTitle === "online") {
        avatarImage.style.border = "3px solid #4caf50"; // green
      } else if (statusTitle === "offline") {
        avatarImage.style.border = "3px solid #ffffff"; // white
      } else if (statusTitle === "away") {
        avatarImage.style.border = "3px solid #abaf4c"; // yellow
      } else if (statusTitle.includes("viewing")) {
        avatarImage.style.border = "3px solid #2196f3"; // blue for viewing thread/page
      } else {
        // Unknown/unsupported: clear any previous styling applied by this feature
        avatarImage.style.border = "";
      }

      roundProfileIcons
        ? (avatarImage.style.borderRadius = "50%")
        : (avatarImage.style.borderRadius = "4px");

      if (standardizeAvatarSize) {
        avatarImage.style.width = "100px";
        avatarImage.style.height = "100px";
      }
    });
  }
}

export default new PostAuthorIndicators();
