const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Text = require("../../configurables/Text");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

class FilterByKeyword extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Filter Convo Messages",
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
    const blacklisted = Util.getConfigurableValue("ConvoFilterKeywords", this, settings);
    const hideFlips = Util.getConfigurableValue("ConvoFilterFlips", this, settings);
    const hideJackpots = Util.getConfigurableValue("ConvoFilterJackpot", this, settings);
    const mutationHandler = function(mutationRecords) {
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
            // TODO: Filter group
          }
        });
      });
    };

    const targetNodes = $("#message-convo");
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const myObserver = new MutationObserver(mutationHandler);
    const obsConfig = { childList: true, characterData: false, attributes: false, subtree: true };

    // --- Add a target node to the observer. Can only add one node at a time.
    targetNodes.each(function() {
      myObserver.observe(this, obsConfig);
    });
  }
};

module.exports = new FilterByKeyword();
