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

    // Collect UIDs of users currently viewing this thread
    const usersViewing: number[] = [];
    try {
      const viewingSpan = (document.querySelector(
        "#content > div.wrapper-content > span.smalltext"
      ) ||
        Array.from(
          document.querySelectorAll(".wrapper-content span.smalltext")
        ).find((el) =>
          (el.textContent || "").toLowerCase().includes("users viewing")
        )) as HTMLSpanElement | undefined;

      if (viewingSpan) {
        const viewerLinks = viewingSpan.querySelectorAll(
          'a[href*="member.php?action=profile&uid="]'
        );
        viewerLinks.forEach((a) => {
          const href = a.getAttribute("href") || "";
          const uidStr = href.split("&uid=")[1] || "";
          const uid = parseInt(uidStr, 10);
          if (!Number.isNaN(uid)) usersViewing.push(uid);
        });
      }
    } catch (_) {}

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

      // Determine the UID for this post's author
      let userId = 0;
      try {
        const profileLink =
          (post.querySelector(
            ".author_information .largetext > a"
          ) as HTMLAnchorElement | null) ||
          (post.querySelector(
            ".author_avatar > a"
          ) as HTMLAnchorElement | null);
        const href = profileLink?.getAttribute("href") || "";
        userId = parseInt(href.split("&uid=")[1] || "", 10) || 0;
      } catch (_) {}

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

      // Possible colors (Blue: #4c79af, Red: #af504c, Light Blue: #4cabaf, Purple: #504caf, Violet: #814caf)
      // Get colors from color-wheel tool so the shades match: https://colordesigner.io/color-wheel
      if (userId && usersViewing.includes(userId)) {
        avatarImage.style.border = "3px solid #4c79af"; // blue
      } else if (statusTitle === "online") {
        avatarImage.style.border = "3px solid #4caf50"; // green
      } else if (statusTitle === "offline") {
        avatarImage.style.border = "3px solid #ffffff"; // red or white?
      } else if (statusTitle === "away") {
        avatarImage.style.border = "3px solid #abaf4c"; // yellow
      } else {
        // Unknown/unsupported
        avatarImage.style.border = "3px solid #ffffff"; // white
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
