import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import { Util } from "../../core/Util";
import HFX from "../../sections/HFX";

enum HFXBadgesStorageKeys {
  BADGE_MAP = "badgeMap",
  LAST_FETCH_TIME = "lastFetchTime",
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
          description: "Map of badges to display",
          defaultValue: {},
        },
        {
          id: HFXBadgesStorageKeys.LAST_FETCH_TIME,
          description: "Last time the badges were fetched",
          defaultValue: 0,
        },
      ],
    });
  }
  fetchDelay: number = Util.isDevelopment() ? 0 : 15; // Delay (minutes) between new alert fetches
  now = Date.now();
  fetchLocation =
    "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/badges.json?nc=" +
    this.now;

  run(settings: any) {
    const STORAGE_KEYS = {
      BADGE_MAP: `storage_${HFXBadgesStorageKeys.BADGE_MAP}`,
      LAST_FETCH_TIME: `storage_${HFXBadgesStorageKeys.LAST_FETCH_TIME}`,
    };
    const badgeMap = settings[STORAGE_KEYS.BADGE_MAP];
    const lastFetchTime = settings[STORAGE_KEYS.LAST_FETCH_TIME];
    const timePassed =
      settings[STORAGE_KEYS.LAST_FETCH_TIME] !== undefined
        ? Math.floor(
            (new Date().getTime() - lastFetchTime) /
              (this.fetchDelay * 60 * 1000)
          )
        : this.fetchDelay;

    if (timePassed < this.fetchDelay) {
      Logger.debug(
        `Badges: ${timePassed} - needs ${this.fetchDelay} minutes. Skipping.`
      );

      if (badgeMap !== undefined) {
        this.appendBadges(badgeMap);
      }
    } else {
      fetch(this.fetchLocation)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then((fetchedBadges) => {
          const newLastFetchTime = new Date().getTime();
          const newBadgeMap = {
            badges: fetchedBadges,
          };

          if (
            badgeMap.badges !== undefined ||
            badgeMap?.badges?.hidden !== false
          ) {
            fetchedBadges.hidden = false;
            newBadgeMap.badges = fetchedBadges;
            this.appendBadges(fetchedBadges);
          }

          this.settingsService.setStorageItem(
            this,
            HFXBadgesStorageKeys.BADGE_MAP,
            newBadgeMap
          );
          this.settingsService.setStorageItem(
            this,
            HFXBadgesStorageKeys.LAST_FETCH_TIME,
            newLastFetchTime
          );
        })
        .catch((err) => {
          console.log(err);
          Logger.error("Failed to fetch badge data.");
        });
    }
  }

  private appendBadges(badges: any) {
    // Copy badge object to prevent issues with settings above
    // Remove hidden property since it isn't needed here
    const badgeList = Object.assign({}, badges);
    delete badgeList["hidden"];

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
