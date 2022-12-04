const Feature = require("../../core/Feature");
const Reputation = require("../../sections/Reputation");
const Util = require("../../core/Util");
const Settings = require("../../core/Settings");
const Logger = require("../../core/Logger");

const SectionArray = require("../../core/SectionArray");
const Section = require("../../core/Section");
const threadSection = new Section("/showthread.php");
const profileSection = new Section("/member.php");

class LegacyReputation extends Feature {
  constructor() {
    super({
      section: Reputation,
      name: "Legacy Reputation",
      default: true,
      description: "Show legacy reptutation total on posts, profiles, and more.",
      additionalSections: new SectionArray(threadSection, profileSection)
    });
    this.fetchDelay = Util.isDevelopment() ? 0 : 15; // Delay (minutes) between new alert fetches
    this.now = Date.now();
    // TODO: update
    this.fetchLocation = "https://raw.githubusercontent.com/xadamxk/HFX2.0/feature/legacy-reputation/reputationArchive.json"; // "https://raw.githubusercontent.com/xadamxk/HFX2.0/feature/legacy-reputation/reputationArchive.json";
    this.legacyCutoffDate = new Date("June 11, 2018 11:50"); // https://hackforums.net/showthread.php?tid=5847386
    this.threadLink = "";
  }

  run() {
    Settings.get(this, item => {
      const timePassed = item.legacyReputationLastChecked !== undefined ? Math.floor((new Date().getTime() - item.legacyReputationLastChecked) / (this.fetchDelay * 60 * 1000)) : this.fetchDelay;

      if (Math.floor(timePassed < this.fetchDelay)) {
        Logger.debug(`LegacyReputation: ${timePassed} - needs ${this.fetchDelay} minutes. Skipping.`);

        if (item.currentLegacyReputation !== undefined) {
          this.appendData(item.currentLegacyReputation);
        }
      } else {
        $.getJSON(this.fetchLocation, fetchedData => {
          item.legacyReputationLastChecked = new Date().getTime();
          item.currentLegacyReputation = fetchedData;
          this.appendData(item.currentLegacyReputation);

          Settings.set(this, item);
        }).fail(function() {
          Logger.error("Failed to fetch LegacyReputation data.");
        });
      }
    });
  }

  determineReputationClass(value) {
    if (!value) return null;
    if (isNaN(value)) return "group4"; // ∞ for admin
    if (value > 0) return "reputation_positive";
    if (value === 0) return "reputation_neutral";
    if (value < 0) return "reputation_negative";
  };

  appendData(data) {
    const url = window.location.href;
    if (url.includes("showthread.php")) {
      $("#posts").find(".post").each((index, post) => {
        const posterUID = $(post).find(".author_information > strong > span.largetext > a").attr("href").replace("https://hackforums.net/member.php?action=profile&uid=", "");
        const posterJoinDateStr = $(post).find(".author_avatar > a").attr("data-tooltip").replace("Joined ", "");
        const posterJoinDate = new Date(posterJoinDateStr) || new Date();
        const hasLegacyReputation = posterJoinDate < this.legacyCutoffDate;

        const reputationRecord = data?.[posterUID] || null;
        const reputationLabel = reputationRecord || (hasLegacyReputation ? "??" : "--");
        $(post).find(".author_wrapper").append($("<div>").addClass("author_row")
          .append($("<div>").addClass("author_label").text("Reputation:").attr({"title": "Legacy Reputation Userscript"}))
          .append($("<div>").addClass("author_value").append($("<a>").attr({"href": this.threadLink}).append($("<strong>").text(reputationLabel.toLocaleString()).addClass(this.determineReputationClass(reputationRecord)))))
        );
      });
    } else if (url.includes("member.php?action=profile")) {
      const profileUID = url.split("&uid=")[1] || null;
      const profileCard = $(".pro-adv-content-info > .pro-adv-card:eq(0)");
      const joinDateStr = $(profileCard).find("strong:contains('Join Date')").parent().text().split(":")[1].replace(/(\d+)(st|nd|rd|th)/, "$1");
      const profileJoinDate = joinDateStr ? new Date("joinDateStr") : new Date();
      const hasLegacyReputation = profileJoinDate < this.legacyCutoffDate;
      const reputationRecord = data?.[profileUID] || null;
      const reputationLabel = reputationRecord || (hasLegacyReputation ? "??" : "--");

      $(profileCard).find("strong:contains('Popularity')").parent()
        .after($("<div>").css({"padding": "4px 12px"})
          .append($("<strong>").text("Reputation: "))
          .append($("<a>").attr("href", this.threadLink)
            .append($("<strong>").addClass(this.determineReputationClass(reputationRecord)).text(reputationLabel.toLocaleString()))));
    }
  }
}

module.exports = new LegacyReputation();
