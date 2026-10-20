import { Feature } from "../../core/Feature";
import { Util } from "../../core/Util";
import HFX from "../../sections/HFX";

enum HFXBadgesStorageKeys {
  BADGE_MAP = "badgeMap",
}

/** Badge lists keyed by badge name, as published in badges.json. */
type BadgeList = { [badgeName: string]: any };

/** Cached badges and when they were fetched, stored as one item. */
interface BadgeCache {
  value?: BadgeList;
  fetchedAt?: number;
}

/**
 * Whether badges fetched at `fetchedAt` are due for a refresh, i.e. at least
 * `fetchDelay` minutes old. A missing or future timestamp counts as stale.
 */
export function isBadgeCacheStale(
  fetchedAt: unknown,
  fetchDelay: number,
  now: number = Date.now()
): boolean {
  if (typeof fetchedAt !== "number") {
    return true;
  }
  const elapsed = now - fetchedAt;
  return elapsed < 0 || elapsed >= fetchDelay * 60_000;
}

class HFXBadges extends Feature {
  constructor() {
    super({
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

  run(settings: any) {
    // Caches from older versions ({ badges }) have no fetchedAt, so they refetch
    const cache: BadgeCache | null | undefined =
      settings[`storage_${HFXBadgesStorageKeys.BADGE_MAP}`];
    const cachedBadges = cache?.value;

    if (!isBadgeCacheStale(cache?.fetchedAt, this.fetchDelay)) {
      this.logger.debug(
        `Badges fetched less than ${this.fetchDelay} minutes ago. Skipping fetch.`
      );
      if (cachedBadges) {
        this.appendBadges(cachedBadges);
      }
      return;
    }

    fetch(this.fetchLocation)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(
        (fetchedBadges: BadgeList) => {
          this.appendBadges(fetchedBadges);
          const newCache: BadgeCache = {
            value: fetchedBadges,
            fetchedAt: Date.now(),
          };
          return this.settingsService.setStorageItem(
            this,
            HFXBadgesStorageKeys.BADGE_MAP,
            newCache
          );
        },
        (err) => {
          this.logger.error("Failed to fetch badge data.", err);
          // Fall back to the last badges fetched, if any
          if (cachedBadges) {
            this.appendBadges(cachedBadges);
          }
        }
      )
      .catch((err) => {
        this.logger.error("Failed to show or save badge data.", err);
      });
  }

  private appendBadges(badgeList: BadgeList) {
    // Loop posts
    const posts = document.querySelectorAll(".post");
    posts.forEach((post, postIndex) => {
      // Get uid
      const userLinkEl = post.querySelector(
        ".author_information > strong > .largetext > a"
      ) as HTMLAnchorElement | null;
      const userLink = userLinkEl?.getAttribute("href") ?? null;
      const uidStr = userLink
        ? userLink.split("?action=profile&uid=")[1]
        : null;
      let uid = 0;
      if (!uidStr) {
        return;
      }

      // Parse uid as number
      try {
        uid = parseInt(uidStr, 10);
      } catch (error) {
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
