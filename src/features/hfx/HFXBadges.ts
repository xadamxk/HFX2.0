import { Feature } from "../../core/Feature";
import { getPosts } from "../../core/Posts";
import { getOrFetch } from "../../core/Remote";
import { Util } from "../../core/Util";
import HFX from "../../sections/HFX";

enum HFXBadgesStorageKeys {
  BADGE_MAP = "badgeMap",
}

/** Badge lists keyed by badge name, as published in badges.json. */
type BadgeList = { [badgeName: string]: any };

class HFXBadges extends Feature {
  constructor() {
    super({
      id: "HFXBadges",
      section: HFX,
      name: "HFX Badges",
      enabled: true,
      description:
        "HFX User Badges earned in various ways. Learn more on the release thread.",
      readonly: true,
      storageItems: [
        {
          id: HFXBadgesStorageKeys.BADGE_MAP,
          description: "Badges to display and when they were fetched",
          // { value: BadgeList, fetchedAt } once fetched (see getOrFetch)
          defaultValue: {},
        },
      ],
    });
  }
  fetchDelay: number = Util.isDevelopment() ? 0 : 15; // Delay (minutes) between new badge fetches
  now = Date.now();
  fetchLocation =
    "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/badges.json?nc=" +
    this.now;

  async run() {
    // Caches from older versions ({ badges }) have no fetchedAt, so they
    // refetch. If a refetch fails, the last badges fetched are shown.
    let badges: BadgeList;
    try {
      badges = await getOrFetch(
        this,
        HFXBadgesStorageKeys.BADGE_MAP,
        this.fetchDelay * 60_000,
        () => this.fetchBadges(),
        this.settingsService
      );
    } catch (err) {
      this.logger.error("Failed to fetch badge data.", err);
      return;
    }
    this.appendBadges(badges);
  }

  private async fetchBadges(): Promise<BadgeList> {
    const response = await fetch(this.fetchLocation);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as BadgeList;
  }

  private appendBadges(badgeList: BadgeList) {
    // Badges show on thread pages; elsewhere there are no posts
    const posts = getPosts({ optional: true });
    posts.forEach(({ el: post, authorUid: uid }, postIndex) => {
      if (!uid) {
        return;
      }

      // Append badge container
      const containerName = ["userBadgeContainer", uid, postIndex].join("-");
      const awardsContainer = post.querySelector(".post_myawards");
      if (!awardsContainer) {
        return;
      }

      let container = document.getElementById(
        containerName
      ) as HTMLDivElement | null;
      if (!container) {
        container = document.createElement("div");
        container.style.width = "144px";
        container.style.textAlign = "center";
        container.id = containerName;
        awardsContainer.insertBefore(container, awardsContainer.firstChild);
      }

      // Loop badge entries
      for (const [badgeName, badgeProperties] of Object.entries(badgeList)) {
        const badgeDescription = (badgeProperties as any)["description"];
        const badgeRecipients = (badgeProperties as any)["users"] as
          | number[]
          | undefined;

        // If user id is in badge recipients list
        if (Array.isArray(badgeRecipients) && badgeRecipients.includes(uid)) {
          // Append badge image
          let badgeSrc = "";
          switch (badgeName) {
            case "contributors":
              badgeSrc = Util.getURL("/assets/badges/trophy_contributer.png");
              break;
            case "donators":
              badgeSrc = Util.getURL("/assets/badges/trophy_donator.png");
              break;
            case "supporters":
              badgeSrc = Util.getURL("/assets/badges/trophy_supporter.png");
              break;
            case "testers":
              badgeSrc = Util.getURL("/assets/badges/trophy_tester.png");
              break;
            case "codeMonkeys":
              badgeSrc = Util.getURL("/assets/badges/trophy_codemonkey.png");
              break;
            case "openSourceContributors":
              badgeSrc = Util.getURL("/assets/badges/trophy_hfx_white.png");
              break;
            default:
              continue;
          }
          // Append badge
          const img = document.createElement("img");
          img.setAttribute("src", badgeSrc);
          if (badgeDescription) {
            img.setAttribute("title", badgeDescription);
          }
          container.appendChild(img);
        }
      }

      if (container.hasChildNodes()) {
        const br = document.createElement("br");
        container.insertAdjacentElement("afterend", br);
      }
    });
  }
}

export default new HFXBadges();
