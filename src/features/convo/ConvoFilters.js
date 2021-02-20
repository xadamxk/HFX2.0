const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Text = require("../../configurables/Text");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");
const Storage = require("../../core/Storage");

class ConvoFilters extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Convo Filters",
      default: true,
      description: "Filter convos by keyword, user, group, and more.",
      configurables: new ConfigurableArray(
        new Text({ id: "ConvoFilterKeywords", label: "Blacklisted Terms (ie. ebook,anime)", default: "" }),
        new Checkbox({ id: "ConvoFilterFlips", label: "Hide Flips", default: false }),
        new Checkbox({ id: "ConvoFilterJackpot", label: "Hide Jackpot", default: false })
      )
    });
  }

  run(settings) {
    // let blacklistedUsers = Util.getLocalSetting(this, "blacklistedUsers");
    // Util.saveLocalSetting(this, "testkey", "testvalue");
    // console.log(Util.getLocalStorageKeys());

    // Retrieve convo filter settings
    const blacklisted = Util.getConfigurableValue("ConvoFilterKeywords", this, settings);
    const hideFlips = Util.getConfigurableValue("ConvoFilterFlips", this, settings);
    const hideJackpots = Util.getConfigurableValue("ConvoFilterJackpot", this, settings);
    // Callback for observer
    const messageMutationHandler = function(mutationRecords) {
      // Loop mutations
      mutationRecords.forEach(function(mutation) {
        // Loop element nodes
        mutation.addedNodes.forEach((node) => {
          // Received message
          if ($(node).hasClass("message-convo-left")) {
            const message = $(node).find(".message-bubble-message")[0];
            // Blacklisted terms - loop keywords
            blacklisted && blacklisted.split(",").forEach(blacklistedTerm => {
              if ($(message).text().includes(blacklistedTerm)) {
                $(node).hide();
              }
            });
            // Flips
            if (hideFlips) {
              if ($(message).text().includes("/flip")) {
                $(node).hide();
              }
            }
            // Jackpots
            if (hideJackpots) {
              if ($(message).text().includes("/jackpot play")) {
                $(node).hide();
              }
            }
          }
        });
      });
    };

    const toggleUser = function() {
      const uid = $(this).attr("uid");
      console.log(uid);
    };

    const usemessageMutationHandler = function(mutationRecords) {
      // Loop mutations
      mutationRecords.forEach(function(mutation) {
        // Loop element nodes
        mutation.addedNodes.forEach((node) => {
          // Groups
          if ($(node).hasClass("us-group")) {
            //
          } else if ($(node).hasClass("us-user")) {
            console.log($(node));
            const uid = $(node).attr("data-uid");
            // Append blacklist button to user
            $(node).find(".us-user-right").css({"width": "100%", "display": "block"})
              .append($("<button>").css({"float": "right", "padding": "8px 8px"}).attr({"uid": uid})
                .on("click", toggleUser)
                .append($("<i>").addClass("fas fa-user-plus")));
          }
        });
      });
    };

    const convoMessagesContainer = $("#message-convo");
    const convoUsersContainer = $(".us-content");
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const messageObserver = new MutationObserver(messageMutationHandler);
    const userObserver = new MutationObserver(usemessageMutationHandler);
    const obsConfig = { childList: true, characterData: false, attributes: false, subtree: true };

    // Messages
    convoMessagesContainer.each(function() {
      messageObserver.observe(this, obsConfig);
    });
    // Users
    convoUsersContainer.each(function() {
      userObserver.observe(this, obsConfig);
    });
  }
};

module.exports = new ConvoFilters();
