const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Text = require("../../configurables/Text");
const Util = require("../../core/Util");

class FilterByKeyword extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Filter Convo Messages",
      default: true,
      description: "Automatically hide messages containing keywords (ie 'ebook,tiktok,anime').",
      configurables: new ConfigurableArray(
        new Text({ id: "ConvoFilterKeywords", label: "Blacklisted Terms (ie. 'ebook,anime')", default: "trump" })
        // new Text({ id: "ConvoFilterReplace", label: "Blacklisted Replacement", default: "BLACKLISTED" })
      )
    });
  }

  run(settings) {
    const blacklisted = Util.getConfigurableValue("ConvoFilterKeywords", this, settings);
    // const blacklistReplace = Util.getConfigurableValue("ConvoFilterReplace", this, settings);
    const mutationHandler = function(mutationRecords) {
      // Loop mutations
      mutationRecords.forEach(function(mutation) {
        // Loop element nodes
        mutation.addedNodes.forEach((node) => {
          // Received message
          if ($(node).hasClass("message-convo-left")) {
            // Loop blacklisted keywords
            blacklisted.split(",").forEach(blacklistedTerm => {
              const message = $(node).find(".message-bubble-message")[0];
              if ($(message).text().includes(blacklistedTerm)) {
                // $(node).after(blacklistReplace);
                $(node).hide();
              }
            });
            // Delete matches
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
