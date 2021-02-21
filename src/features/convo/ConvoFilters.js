const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Text = require("../../configurables/Text");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");
const Logger = require("../../core/Logger");

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
        new Checkbox({ id: "ConvoFilterJackpot", label: "Hide Jackpot", default: false }),
        new Checkbox({ id: "ConvoFilterUsers", label: "Enable User Blacklist", default: true })
      )
    });
  }

  async run(settings) {
    const self = this; // TODO: Remove
    let blacklistedUsers = await Util.getLocalSetting(this, "blacklistedUsers") || {};
    Logger.debug("Current Blacklisted Users: " + JSON.stringify(blacklistedUsers));

    // Retrieve convo filter settings
    const blacklisted = Util.getConfigurableValue("ConvoFilterKeywords", this, settings);
    const hideFlips = Util.getConfigurableValue("ConvoFilterFlips", this, settings);
    const hideJackpots = Util.getConfigurableValue("ConvoFilterJackpot", this, settings);
    const enableUserBlacklist = Util.getConfigurableValue("ConvoFilterUsers", this, settings);
    // Callback for observer
    const messageMutationHandler = function(mutationRecords) {
      // Loop mutations
      mutationRecords.forEach(function(mutation) {
        // Loop element nodes
        mutation.addedNodes.forEach((node) => {
          // Received message
          if ($(node).hasClass("message-convo-left")) {
            // Blacklist button creation
            if ($(node).find(".mirum-click-menu")) {
              var uid = $(node).attr("data-uid");
              const isCurrentlyBlocked = blacklistedUsers && blacklistedUsers.hasOwnProperty(uid);
              var innerDiv = `<div><i class="${(isCurrentlyBlocked ? "fal fa-user-minus fa-lg" : "fal fa-user-plus fa-lg")}"></i></div>
                          <div>Blacklist User</div>`;
              // Append blacklist option under menu in user modal card
              $(node).find(".mirum-click-menu")
                .append($("<div>").addClass("mirum-click-menu-row").attr({"uid": uid, "blacklisted": isCurrentlyBlocked, "title": (isCurrentlyBlocked ? "HFX: Unblock User" : "HFX: Block User")})
                  .on("click", toggleUser)
                  .append(innerDiv));
            }

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
            // User blacklist
            if (enableUserBlacklist && blacklistedUsers && Object.keys(blacklistedUsers).length > 0) {
              const uid = $(node).attr("data-uid");
              if (blacklistedUsers.hasOwnProperty(uid)) {
                $(node).hide();
              }
            }
          }
        });
      });
    };

    const toggleUser = function() {
      const uid = $(this).attr("uid");
      // Toggle button properties based on blacklisted status
      if ($(this).attr("blacklisted") === "true") {
        $(this).attr("blacklisted", "false");
        $(this).prop("title", "HFX: Block User");
        $(this).find("i").removeClass("fa-user-minus");
        $(this).find("i").addClass("fa-user-plus");
        delete blacklistedUsers[uid];
      } else {
        $(this).attr("blacklisted", "true");
        $(this).prop("title", "HFX: Unblock User");
        $(this).find("i").removeClass("fa-user-plus");
        $(this).find("i").addClass("fa-user-minus");
        blacklistedUsers[uid] = true;
      }
      Logger.debug("New Blacklisted Users: " + JSON.stringify(blacklistedUsers));
      Util.saveLocalSetting(self, "blacklistedUsers", blacklistedUsers);
      // TODO: Trigger mutation handler on messages to remove or show messages from updated blacklist
    };

    const usemessageMutationHandler = function(mutationRecords) {
      // Loop mutations
      mutationRecords.forEach(function(mutation) {
        // Loop element nodes
        mutation.addedNodes.forEach((node) => {
          // Check if node is a modal card
          if ($(node).hasClass("us-mir-pcard")) {
            var profileUrl = $(node).find("div.mirum-card-profile-info-username > div:nth-child(1) > a");
            if (profileUrl) {
              var uid = $(profileUrl).attr("href").split("uid=")[1];
              const isCurrentlyBlocked = blacklistedUsers && blacklistedUsers.hasOwnProperty(uid);
              var innerDiv = `<div><i class="${(isCurrentlyBlocked ? "fal fa-user-minus fa-lg" : "fal fa-user-plus fa-lg")}"></i></div>
                          <div>Blacklist User</div>`;
              // Append blacklist option under menu in user modal card
              $(node).find(".mirum-click-menu")
                .append($("<div>").addClass("mirum-click-menu-row").attr({"uid": uid, "blacklisted": isCurrentlyBlocked, "title": (isCurrentlyBlocked ? "HFX: Unblock User" : "HFX: Block User")})
                  .on("click", toggleUser)
                  .append(innerDiv));
            }
          }
        });
      });
    };

    const convoMessagesContainer = $("#message-convo");
    const convoUsersContainer = $(".userlist-sidebar");
    // TODO: #message-inbox-list-messages - Add block/unblock buttons to individual conversations
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
