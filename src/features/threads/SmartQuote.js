const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Color = require("../../configurables/Color");
const Util = require("../../core/Util");

class SmartQuote extends Feature {
  constructor() {
    const defaultMentionColor = "#FF3B30";
    const defaultQuoteColor = "#B1D8BF";
    super({
      section: Threads,
      name: "Smart Quote",
      default: true,
      description: "Adds styling and highlights mentioned quotes.",
      configurables: new ConfigurableArray(
        new Color({id: "SQMentionColor", label: "Mention Color", default: defaultMentionColor}),
        new Color({id: "SQColor", label: "Quote Color", default: defaultQuoteColor})
      )
    });
  }

  run(settings) {
    const username = $(".welcome > strong > a").text();
    const mentionColor = Util.getConfigurableValue("SQMentionColor", this, settings) ? Util.getConfigurableValue("SQMentionColor", this, settings) : this.defaultMentionColor;
    const quoteColor = Util.getConfigurableValue("SQColor", this, settings) ? Util.getConfigurableValue("SQColor", this, settings) : this.defaultQuoteColor;
    // Loop quotes
    $("blockquote").each(function() {
      // blockquote
      $(this).css({
        "border-radius": "5px",
        "border": "1px solid black",
        "padding": "1px 4px",
        "margin-top": "10px"
      });

      // blackquote header
      const isMentioned = $(this).find("cite").text().includes(username);
      $(this).find("cite").css({
        "border-radius": "5px",
        "border": "1px solid black",
        "background": isMentioned ? mentionColor : quoteColor
      });
      // TODO: Remove ::after css for border bottom (https://stackoverflow.com/questions/17788990/access-the-css-after-selector-with-jquery)
    });
  }
};

module.exports = new SmartQuote();
