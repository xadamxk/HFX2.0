const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Checkbox = require("../../configurables/Checkbox");
const Threads = require("../../sections/Threads");

// TODO: Move from threads to Convo (and move threads to additionalSections)
const newReplySection = new Section("/newreply.php");
const editPostSection = new Section("/editpost.php");
const newThreadSection = new Section("/newthread.php");
const newPrivateMessageSection = new Section("/private.php");
const newConvoSection = new Section("/convo.php");

// const Settings = require("../../core/Settings");
const Logger = require("../../core/Logger");
const Util = require("../../core/Util");

class EmoteLibrary extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Emote Library",
      default: true,
      description: "Adds additional emotes to posts, threads, and more!",
      additionalSections: new SectionArray(newReplySection, editPostSection, newThreadSection, newPrivateMessageSection, newConvoSection),
      configurables: new ConfigurableArray(
        new Checkbox({ id: "ELEnableThreads", label: "Enable in Threads", default: false })
      )
    });
    this.fetchDelay = Util.isDevelopment() ? 0 : 15; // Delay (minutes) between new alert fetches
    this.now = Date.now();
    this.fetchLocation = "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/emotes.json?nc=" + this.now;
    this.emotes = null;
  }

  run(settings) {
    this.appendEmotes(null, settings);
    $("head").append("<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js\"></script>");
    // Settings.get(this, item => {
    //   const timePassed = item.emotesLastChecked !== undefined ? Math.floor((new Date().getTime() - item.emotesLastChecked) / (this.fetchDelay * 60 * 1000)) : this.fetchDelay;

    //   if (Math.floor(timePassed < this.fetchDelay) && item.emotes) {
    //     Logger.debug(`Emotes: ${timePassed} - needs ${this.fetchDelay} minutes. Skipping.`);
    //     this.appendEmotes(item.emotes, settings);
    //   } else {
    //     $.getJSON(this.fetchLocation, fetchedEmotes => {
    //       item.emotesLastChecked = new Date().getTime();
    //       item.emotes = fetchedEmotes;
    //       Settings.set(this, item);
    //       this.appendEmotes(item.emotes, settings);
    //     }).fail(function() {
    //       Logger.error("Failed to fetch emote data.");
    //     });
    //   }
    // });
  }

  appendEmotes(emotes, settings) {
    let address = location.href;
    const enabledOnThreads = Util.getConfigurableValue("ELEnableThreads", this, settings);
    switch (address) {
      // TODO: add extra param to appendSmilies for where to search for text to replace
      case this.isMatch(address, "/showthread.php"):
        return this.parseThreadEmotes(emotes);
      case this.isMatch(address, "/newreply.php"):
        return enabledOnThreads && this.appendSmilies("#new_reply_form > table > tbody > tr:eq(2) > td:eq(0)", emotes);
      case this.isMatch(address, "/editpost.php"):
        return enabledOnThreads && this.appendSmilies("#editpost > table > tbody > tr:eq(4) > td:eq(0)", emotes);
      case this.isMatch(address, "/newthread.php"):
        return enabledOnThreads && this.appendSmilies("form[name=input] > table > tbody > tr:eq(4) > td:eq(0)", emotes);
      case this.isMatch(address, "/private.php"):
        return $("form[name=input]").length > 0
          ? this.appendSmilies("form[name=input] > table > tbody > tr > td > table > tbody > tr:eq(4) > td:eq(0)", emotes) : null;
      case this.isMatch(address, "/convo.php"):
        console.log("in here");
        return this.appendToConvo();
      default:
        Logger.error("HFX: New EmoteLibrary page found, please report this error to a developer.");
    }
  }

  appendToConvo() {
    // Append emoji button
    $("#convoControlsRow").append($("<button>")
      .addClass("button pro-adv-3d-button").css({
        "vertical-align": "middle",
        "background-color": "#1f1f1f",
        "padding": "7px 15px !important",
        "font-weight": "bold",
        "height": "31px",
        "width": "48px"
      }).attr("onclick", "$('#hfxEmojiPicker').toggle();")
      .append($("<i>").addClass("fa fa-comment-smile fa-lg")));
    // Append emoji picker and hide it
    $(".message-main").append("<emoji-picker id='hfxEmojiPicker' style='position:absolute; bottom: 70px; right: 0px; z-index:3;'></emoji-picker>");
    $("#hfxEmojiPicker").hide();
    // Emoji listener
    document.querySelector("emoji-picker").addEventListener("emoji-click", event => {
      document.querySelector("#comment").value += event.detail.unicode;
    });
  }

  parseThreadEmotes(emotes) {
    const self = this;
    // Loop posts
    $(".post").each(function() {
      const post = $(this).find(".post_body");
      let postHtml = $(post).html();
      // Loop categories
      Object.entries(emotes).forEach(entry => {
        const [emoteCategory, emotesMap] = entry;
        Object.entries(emotesMap).forEach(emote => {
          const [emoteKey, emoteUrl] = emote;
          if (postHtml.includes(emoteKey)) {
            postHtml = Util.replaceAll(postHtml, `:${emoteKey}:`,
              `<img 
              src="${emoteUrl}" 
              width="${self.emoteSize(emoteCategory)}" 
              height="${self.emoteSize(emoteCategory)}"
              title="${emoteKey}" 
              />`);
          }
        });
      });
      $(this).find(".post_body").html(postHtml);
    });
  }

  isMatch(address, match) {
    return address.includes(match) ? address : "";
  }

  // Style for individual emotes
  emoteSize(category) {
    switch (category.toLowerCase()) {
      case "legacy": return "";
      default: return "28";
    }
  };

  appendSmilies(tagContainer, emotes) {
    const emotesTable = $(tagContainer).find("div:eq(0)").find("table > tbody");
    $(emotesTable).find("tr:eq(0)").after($("<tr>").append($("<td>").addClass("").append($("<div>").addClass("expcolimage")
      .append($("<img>").attr({"src": "https://hackforums.net/images/mobale/collapse.png", "id": "hfxEmoteCollapseDefault", "class": "expander", "alt": "[-]", "title": "[-]"}).css("cursor", "pointer")))
      .append($("<div>").text("Default"))));
    // Click listener
    $("#hfxEmoteCollapseDefault").on("click", function() {
      $(emotesTable).find("tr:eq(2)").toggle();
    });
    // Emote table style
    emotesTable.parent().parent().css({
      "overflow-y": "auto",
      "height": "500px",
      "width": "200px"
    });

    // Emote categories
    Object.entries(emotes).forEach(entry => {
      const [emoteCategory, emotesMap] = entry;
      // Append category header
      $(emotesTable).append($("<tr>").append($("<td>").addClass("").append($("<div>").addClass("expcolimage")
        .append($("<img>").attr({"src": "https://hackforums.net/images/mobale/collapse.png", "id": "hfxEmoteCollapse" + emoteCategory, "class": "expander", "alt": "[-]", "title": "[-]"}).css("cursor", "pointer")))
        .append($("<div>").text(`${emoteCategory} (HFX)`))));
      // Append category emotes
      $(emotesTable).append($("<tr>").append($("<td>").addClass("trow1")
        .attr("id", "hfxEmoteCategory_" + emoteCategory)
        .css({
          "display": "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          "justify-content": "center"
        })));
      // Click listener
      $("#hfxEmoteCollapse" + emoteCategory).on("click", function() {
        $("#hfxEmoteCategory_" + emoteCategory).toggle();
      });
      // Append emotes in category to table
      Object.entries(emotesMap).forEach(emote => {
        const [emoteKey, emoteUrl] = emote;
        $("#hfxEmoteCategory_" + emoteCategory).append(
          $("<span>").attr("onclick", `MyBBEditor.insertText(':${emoteKey}: ')`)
            .css({"height": "35px", "margin": "4px", "font-size": "18px", "flex": "1 0 calc(25% - 10px)", "box-sizing": "border-box", "cursor": "pointer"})
            .append($("<img>").attr({"src": emoteUrl, "title": `:${emoteKey}:`}).css({"height": this.emoteSize(emoteCategory), "width": this.emoteSize(emoteCategory)})));
      });
    });
  }
};

module.exports = new EmoteLibrary();
