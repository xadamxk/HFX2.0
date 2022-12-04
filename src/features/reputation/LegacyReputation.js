const Feature = require("../../core/Feature");
const Reputation = require("../../sections/Reputation");
const Util = require("../../core/Util");
const Settings = require("../../core/Settings");
const Logger = require("../../core/Logger");

const SectionArray = require("../../core/SectionArray");
const Section = require("../../core/Section");
const threadSection = new Section("/showthread.php");
const profileSection = new Section("/member.php");
const legacyReputationSection = new Section("/reputation_archive.php");

class LegacyReputation extends Feature {
  constructor() {
    super({
      section: Reputation,
      name: "Legacy Reputation",
      default: true,
      description: "Show legacy reptutation total on posts, profiles, and more.",
      additionalSections: new SectionArray(threadSection, profileSection, legacyReputationSection)
    });
    this.fetchDelay = Util.isDevelopment() ? 0 : 15; // Delay (minutes) between new alert fetches
    this.now = Date.now();
    // TODO: update
    this.fetchLocation = "https://raw.githubusercontent.com/xadamxk/HFX2.0/feature/legacy-reputation/reputationArchive.json"; // "https://raw.githubusercontent.com/xadamxk/HFX2.0/feature/legacy-reputation/reputationArchive.json";
    this.legacyCutoffDate = new Date("June 11, 2018 11:50"); // https://hackforums.net/showthread.php?tid=5847386
    this.threadLink = "";
  }

  run() {
    const url = window.location.href;
    if (url.includes("reputation_archive.php")) {
      $(".breadcrumb").after($("<div>").css({ "paddingBottom": "4px", "float": "right" }).append($("<a>").addClass("button").attr({ "href": "javascript:void(0);", "id": "shareReputationArchive" }).append($("<span>").text("Share Summary"))));
      const self = this;
      $("#shareReputationArchive").click(function() {
        if (confirm("Are you sure you want to share your reputation archive summary with xadamxk?")) {
          self.sendLegacyReport();
        }
      });
    } else {
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

  getLegacyReputationSummary() {
    const totalReputation = $(".repbox").text().replace(",", "");
    const allTimeRow = $(".reputation > tbody > tr:eq(4)")[0];
    const allTimePositives = $(allTimeRow).find("td:eq(1)").text();
    const allTimeNeutrals = $(allTimeRow).find("td:eq(2)").text();
    const allTimeNegatives = $(allTimeRow).find("td:eq(3)").text();
    const userId = $(".welcome > strong > a").attr("href").replace("https://hackforums.net/member.php?action=profile&uid=", "");
    const username = $(".welcome > strong > a").text();
    return {
      "uid": parseInt(userId),
      "username": username,
      "total": parseInt(totalReputation),
      "positives": parseInt(allTimePositives),
      "neutrals": parseInt(allTimeNeutrals),
      "negatives": parseInt(allTimeNegatives)

    };
  };

  formatLegacyReputationSummary(summary) {
    const currentTimeInSeconds = new Date().getTime() / 1000;
    return `[quote="ReputationArchiveExport" dateline="${Math.floor(currentTimeInSeconds)}"]
    ${btoa(JSON.stringify(summary))}
    [/quote]`;
  };

  sendLegacyReport() {
    const userPostKey = $("head").html().match(/my_post_key = "([a-f0-9]+)"/).pop() || null;
    const summary = this.getLegacyReputationSummary();
    try {
      $.ajax({
        type: "POST",
        url: "https://hackforums.net/private.php",
        data: {
          "my_post_key": userPostKey,
          "to": "xadamxk",
          "bcc": "",
          "subject": Util.isDevelopment ? `ReputationArchiveExport_${new Date().getTime()}` : "ReputationArchiveExport",
          "message": this.formatLegacyReputationSummary(summary),
          "action": "do_send",
          "submit": "Send Message"
        },
        success: () => {
          this.sendNotification("Successfully shared Reputation Archive Summary with xadamxk. Thank you :)");
        }
      });
    } catch (err) {
      console.log(err);
      this.sendNotification("Failed to share Reputation Archive Summary. Contact xadamxk for assistance.", false);
    };
  };

  sendNotification(message, isError = false) {
    alert(message);
  };
}

module.exports = new LegacyReputation();
