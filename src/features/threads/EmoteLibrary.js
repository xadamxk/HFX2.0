const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");
const Threads = require("../../sections/Threads");

const newReplySection = new Section("/newreply.php");
const editPostSection = new Section("/editpost.php");
const newThreadSection = new Section("/newthread.php");

const Settings = require("../../core/Settings");
const Logger = require("../../core/Logger");
const Util = require("../../core/Util");

class EmoteLibrary extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Emote Library",
      default: true,
      description: "Adds additional emotes to posts, threads, and more!",
      additionalSections: new SectionArray(newReplySection, editPostSection, newThreadSection)
    });
    this.fetchDelay = Util.isDevelopment() ? 0 : 15; // Delay (minutes) between new alert fetches
    this.now = Date.now();
    this.fetchLocation = "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/emotes.json?nc=" + this.now;
    this.emotes = null;
  }

  run() {
    Settings.get(this, item => {
      const timePassed = item.emotesLastChecked !== undefined ? Math.floor((new Date().getTime() - item.emotesLastChecked) / (this.fetchDelay * 60 * 1000)) : this.fetchDelay;
      if (Math.floor(timePassed < this.fetchDelay)) {
        console.log("if");
        Logger.debug(`Emotes: ${timePassed} - needs ${this.fetchDelay} minutes. Skipping.`);

        if (item.emotes !== undefined) {
          this.appendEmotes(item.emotes);
        }
      } else {
        console.log("else");
        $.getJSON(this.fetchLocation, fetchedEmotes => {
          item.emotesLastChecked = new Date().getTime();
          item.emotes = fetchedEmotes;
          Settings.set(this, item);
          this.appendEmotes(item.emotes);
        }).fail(function() {
          Logger.error("Failed to fetch emote data.");
        });
      }
    });
  }

  appendEmotes(emotes) {
    console.log(emotes);
    let address = location.href;

    switch (address) {
      case this.isMatch(address, "/showthread.php"):
        // TODO: Replace text with emotes
        return null;
      case this.isMatch(address, "/newreply.php"):
        return this.appendSmilies("#new_reply_form > table > tbody > tr:eq(2) > td:eq(0)", emotes);
      case this.isMatch(address, "/editpost.php"):
        return this.appendSmilies("#editpost > table > tbody > tr:eq(4) > td:eq(0)", emotes);
      case this.isMatch(address, "/newthread.php"):
        return this.appendSmilies("form[name=input] > table > tbody > tr:eq(4) > td:eq(0)", emotes);
      default:
        console.log("HFX: New EmoteLibrary page found, please report this error to a developer.");
    }
  }

  isMatch(address, match) {
    return address.includes(match) ? address : "";
  }

  appendSmilies(tagContainer, emotes) {
    const emotesTable = $(tagContainer).find("div:eq(0)").find("table > tbody");
    $(emotesTable).find("tr:eq(0)").after($("<tr>").text("Standard"));
    emotesTable.parent().parent().css({
      "overflow-y": "auto",
      "height": "500px",
      "width": "190px"
    });

    // Emote categories
    Object.entries(emotes).forEach(entry => {
      const [emoteCategory, emotesMap] = entry;
      // Append category header
      $(emotesTable).append($("<tr>").append($("<td>").addClass("").append($("<span>").text(emoteCategory))));
      // Append category emotes
      $(emotesTable).append($("<tr>").append($("<td>").addClass("trow1")
        .attr("id", "emoteCategory_" + emoteCategory)
        .css({
          "display": "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          "justify-content": "center"
        })));

      // Loop emotes in current category
      // eslint-disable-next-line eqeqeq
      const emoteSize = emoteCategory == "Legacy" ? "" : "24";
      Object.entries(emotesMap).forEach(emote => {
        const [emoteKey, emoteUrl] = emote;
        $("#emoteCategory_" + emoteCategory).append(
          $("<span>").attr("onclick", `MyBBEditor.insertText(':${emoteKey}:')`)
            .css({"height": "35px", "margin": "5px", "font-size": "18px", "flex": "1 0 calc(25% - 10px)", "box-sizing": "border-box", "cursor": "pointer"})
            .append($("<img>").attr("src", emoteUrl).css({"height": emoteSize, "width": emoteSize})));
      });
    });
  }
};

module.exports = new EmoteLibrary();
