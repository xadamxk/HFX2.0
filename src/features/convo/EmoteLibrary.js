const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Checkbox = require("../../configurables/Checkbox");
const Convo = require("../../sections/Convo");

const threadSection = new Section("/showthread.php");
const newReplySection = new Section("/newreply.php");
const editPostSection = new Section("/editpost.php");
const newThreadSection = new Section("/newthread.php");
const newPrivateMessageSection = new Section("/private.php");
const newConvoSection = new Section("/convo.php");

const Settings = require("../../core/Settings");
const Logger = require("../../core/Logger");
const Util = require("../../core/Util");

class EmoteLibrary extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Emote Library",
      default: true,
      description: "Adds additional emotes to convo, private messages, posts, and more!",
      additionalSections: new SectionArray(newReplySection, editPostSection, newThreadSection, newPrivateMessageSection, newConvoSection, threadSection),
      configurables: new ConfigurableArray(
        new Checkbox({ id: "ELEnableThreads", label: "Enable in Threads", default: true }),
        new Checkbox({ id: "ELEnableConvo", label: "Enable in Convo", default: true }),
        new Checkbox({ id: "ELEnablePM", label: "Enable in PMs", default: true })
      )
    });
    this.fetchDelay = Util.isDevelopment() ? 0 : 15; // Delay (minutes) between new alert fetches
    this.now = Date.now();
    this.fetchLocation = "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/emotes.json?nc=" + this.now;
    this.emotes = null;
  }

  run(settings) {
    Settings.get(this, item => {
      const timePassed = item.emotesLastChecked !== undefined ? Math.floor((new Date().getTime() - item.emotesLastChecked) / (this.fetchDelay * 60 * 1000)) : this.fetchDelay;

      if (Math.floor(timePassed < this.fetchDelay) && item.emotes) {
        Logger.debug(`Emotes: ${timePassed} - needs ${this.fetchDelay} minutes. Skipping.`);
        this.appendEmotes(item.emotes, settings);
      } else {
        $.getJSON(this.fetchLocation, fetchedEmotes => {
          item.emotesLastChecked = new Date().getTime();
          item.emotes = fetchedEmotes["emotes"];
          Settings.set(this, item);
          this.appendEmotes(item.emotes, settings);
        }).fail(function() {
          Logger.error("Failed to fetch emote data.");
        });
      }
    });
  }

  appendEmotes(emotes, settings) {
    let address = location.href;
    const enabledInThreads = Util.getConfigurableValue("ELEnableThreads", this, settings);
    const enabledInConvo = Util.getConfigurableValue("ELEnableConvo", this, settings);
    const enabledInPM = Util.getConfigurableValue("ELEnablePM", this, settings);

    switch (address) {
      case this.isMatch(address, "/showthread.php"):
        if (enabledInThreads) {
          return this.parseThreadEmotes(emotes);
        }
        break;
      case this.isMatch(address, "/newreply.php"):
        if (enabledInThreads) {
          this.parseThreadEmotes(emotes);
          return enabledInThreads && this.appendEditorEmotePicker(emotes);
        }
        break;
      case this.isMatch(address, "/editpost.php"):
        if (enabledInThreads) {
          this.parseThreadEmotes(emotes);
          return this.appendEditorEmotePicker(emotes);
        }
        break;
      case this.isMatch(address, "/newthread.php"):
        if (enabledInThreads) {
          this.parseThreadEmotes(emotes);
          return this.appendEditorEmotePicker(emotes);
        }
        break;
      case this.isMatch(address, "/private.php"):
        if (enabledInPM) {
          this.parseThreadEmotes(emotes);
          return $("form[name=input]").length > 0
            ? this.appendEditorEmotePicker(emotes) : null;
        }
        break;
      case this.isMatch(address, "/convo.php"):
        if (enabledInConvo) {
          this.parseConvoEmotes(emotes);
          return this.appendToConvo(emotes);
        }
        break;
      default:
        Logger.error("HFX: New EmoteLibrary page found, please report this error to a developer.");
    }
  }

  appendEditorEmotePicker(emotes) {
    // Append emoji button
    $(".sceditor-toolbar").append($("<div>").addClass("sceditor-group")
      .append($("<a>").attr({"title": "HFX: Emotes"}).css({
        "width": "16pxpx",
        "height": "20px",
        "display": "block",
        "float": "left",
        "cursor": "pointer",
        "padding": "3px 5px",
        "border-radius": "3px",
        "border": "1px solid #444"
      }).attr({"onclick": "$('#hfxEmojiPicker').toggle();"})
        .append($("<div>").attr({"unselectable": "on"}).css({
          "margin": "2px 0px",
          "padding": "0px",
          "overflow": "hidden",
          "color": "transparent",
          "width": "16px",
          "height": "16px"
        }).append($("<img>").attr({"src": Util.getURL("/assets/images/emoji.png")}).css({
          "width": "16px",
          "height": "16px"
        })))));
    // Append emoji picker and hide it
    const picker = new EmojiPickerElement.Picker({
      customEmoji: emotes
    });
    $(".sceditor-container").prepend($(picker).attr("id", "hfxEmojiPicker").css({
      "position": "absolute",
      "top": "40px",
      "right": "0px",
      "z-index": "3"
    }));
    $("#hfxEmojiPicker").hide();
    // Emoji listener
    document.querySelector("emoji-picker").addEventListener("emoji-click", event => {
      let emote = null;
      // Default
      if (event.detail.hasOwnProperty("unicode")) {
        emote = event.detail.unicode;
      }

      // Custom
      if (event.detail.hasOwnProperty("name")) {
        emote = ` :${event.detail.name}:`;
      }

      // Insert emote
      document.querySelector(".sceditor-container > textarea").value += emote;
    });
  }

  parseConvoEmotes(emotes) {
    const self = this;
    const messageMutationHandler = function(mutationRecords) {
      // Loop mutations
      mutationRecords.forEach(function(mutation) {
        // Loop element nodes
        mutation.addedNodes.forEach((node) => {
          // Received or sent message
          if ($(node).hasClass("message-convo-left") || $(node).hasClass("message-convo-right")) {
            const block = node;

            const message = block.querySelector(".message-bubble.message-bubble-message");
            let postHtml = $(message).html();

            // Loop custom emote array
            emotes.forEach((emote) => {
              const category = emote.category;
              const name = emote.name;
              const url = emote.url;

              if (postHtml.includes(`:${name}:`)) {
                postHtml = Util.replaceAll(postHtml, `:${name}:`,
                  `<img 
                  src="${url}" 
                  width="${self.emoteSize(category)}" 
                  height="${self.emoteSize(category)}"
                  title="${name}" 
                  />`);
              }
            });
            // Replace emoji keys with images in html
            $(message).html(postHtml);
          }
        });
      });
    };

    const convoMessagesContainer = $("#message-convo");
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const messageObserver = new MutationObserver(messageMutationHandler);
    const obsConfig = {childList: true, characterData: false, attributes: false, subtree: true};

    convoMessagesContainer.each(function() {
      messageObserver.observe(this, obsConfig);
    });
  }

  appendToConvo(emotes) {
    // Append emoji button
    $("#new_message").after($("<button>")
      .addClass("button pro-adv-3d-button").css({
        "vertical-align": "middle",
        "background-color": "#1f1f1f",
        "padding": "7px 15px !important",
        "font-weight": "bold",
        "height": "31px",
        "margin": "0px 6px !important",
        "width": "99%"
      }).attr("onclick", "$('#hfxEmojiPicker').toggle();")
      .append($("<i>").addClass("fa fa-comment-smile fa-lg")));
    // Append emoji picker and hide it
    const picker = new EmojiPickerElement.Picker({
      customEmoji: emotes
    });
    $(".message-main").append($(picker).attr("id", "hfxEmojiPicker").css({
      "position": "absolute",
      "bottom": "80px",
      "right": "0px",
      "z-index": "3"
    }));
    $("#hfxEmojiPicker").hide();
    // Emoji listener
    document.querySelector("emoji-picker").addEventListener("emoji-click", event => {
      let emote = null;
      // Default
      if (event.detail.hasOwnProperty("unicode")) {
        emote = event.detail.unicode;
      }

      // Custom
      if (event.detail.hasOwnProperty("name")) {
        emote = ` :${event.detail.name}:`;
      }

      // Insert emote
      document.querySelector("#comment").value += emote;
    });
  }

  // Style for individual emotes
  emoteSize(category) {
    switch (category.toLowerCase()) {
      case "legacy": return "";
      default: return "28";
    }
  };

  parseThreadEmotes(emotes) {
    const self = this;
    // Loop posts
    $(".post").each(function() {
      const post = $(this).find(".post_body");
      let postHtml = $(post).html();
      // Loop custom emote array
      emotes.forEach((emote) => {
        const category = emote.category;
        const name = emote.name;
        const url = emote.url;
        if (postHtml.includes(name)) {
          postHtml = Util.replaceAll(postHtml, `:${name}:`,
            `<img 
            src="${url}" 
            width="${self.emoteSize(category)}" 
            height="${self.emoteSize(category)}"
            title="${name}" 
            />`);
        }
      });
      // Replace emoji keys with images in html
      $(this).find(".post_body").html(postHtml);
    });
  }

  isMatch(address, match) {
    return address.includes(match) ? address : "";
  }
};

module.exports = new EmoteLibrary();
