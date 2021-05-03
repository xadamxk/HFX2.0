const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");
const Settings = require("../../core/Settings");
const Logger = require("../../core/Logger");

class Badges extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "HFX Badges",
      default: true,
      disableToggle: true,
      description: "HFX User Badges earned in various ways. Learn more on the release thread."
    });
    this.fetchDelay = 15; // Delay (minutes) between new alert fetches
    this.now = Date.now();
    this.fetchLocation = "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/badges.json?nc=" + this.now;
  }

  run() {
    Settings.get(this, item => {
      const timePassed = item.badgesLastChecked !== undefined ? Math.floor((new Date().getTime() - item.badgesLastChecked) / (this.fetchDelay * 60 * 1000)) : this.fetchDelay;

      if (Math.floor(timePassed < this.fetchDelay)) {
        Logger.debug(`Badges: ${timePassed} - needs ${this.fetchDelay} minutes. Skipping.`);

        if (item.badges !== undefined && !item.badges.hidden) {
          this.appendBadges(item.badges);
        }
      } else {
        $.getJSON(this.fetchLocation, fetchedBadges => {
          item.badgesLastChecked = new Date().getTime();

          if (item.badges === undefined || item.badges.hidden === false || item.badges.BadgesKey !== fetchedBadges.BadgesKey) {
            fetchedBadges.hidden = false;
            item.badges = fetchedBadges;
            this.appendBadges(item.badges);
          }

          Settings.set(this, item);
        });
      }
    });
  }

  appendBadges(badges) {
    // Copy badge object to prevent issues with settings above
    // Remove hidden property since it isn't needed here
    const badgeList = Object.assign({}, badges);
    delete badgeList["hidden"];

    // Loop posts
    $(".post").each((postIndex, post) => {
      // Get uid
      const userLink = $(post).find(".author_information > strong > .largetext > a").attr("href");
      const uidStr = userLink ? userLink.split("?action=profile&uid=")[1] : null;
      let uid = 0;
      if (!uidStr) {
        return;
      }

      // Parse uid as number
      try {
        uid = parseInt(uidStr);
      } catch (error) {
        return;
      }

      // Append badge container
      const containerName = ["userBadgeContainer", uid, postIndex].join("-");
      $(post).find(".post_myawards").prepend("<br>").prepend($("<div>")
        .css({"width": "144px", "text-align": "center"})
        .attr("id", containerName));

      // Loop badge entries
      Object.entries(badgeList).map((key, badgeIndex) => {
        const badgeName = key[0];
        const badgeRecipients = key[1];

        // If user id is in badge recipients list
        if (badgeRecipients.includes(uid)) {
          // Append badge image
          switch (badgeName) {
            case "contributors":
              $(`#${containerName}`).append($("<img>").attr("src",
                chrome.extension.getURL("/assets/images/trophy_contributer.png")));
              break;
            case "donators":
              $(`#${containerName}`).append($("<img>").attr("src",
                chrome.extension.getURL("/assets/images/trophy_donator.png")));
              break;
            case "supporters":
              $(`#${containerName}`).append($("<img>").attr("src",
                chrome.extension.getURL("/assets/images/trophy_supporter.png")));
              break;
            case "testers":
              $(`#${containerName}`).append($("<img>").attr("src",
                chrome.extension.getURL("/assets/images/trophy_tester.png")));
              break;
            default:
          }
        }
      });
    });
  }
};

module.exports = new Badges();
