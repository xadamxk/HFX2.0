const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Color = require("../../configurables/Color");
const Util = require("../../core/Util");

class SmartQuote extends Feature {
  constructor() {
    const defaultMentionColor = "#CD5C5C"; // #FF3B30
    const defaultQuoteColor = "#B1D8BF";
    const defaultHeaderColor = "#000000";
    super({
      section: Threads,
      name: "Smart Quote",
      default: true,
      description: "Adds styling and highlights mentioned quotes.",
      configurables: new ConfigurableArray(
        new Color({id: "SQMentionColor", label: "Mention Color", default: defaultMentionColor}),
        new Color({id: "SQColor", label: "Quote Color", default: defaultQuoteColor}),
        new Color({id: "SQTextColor", label: "Header Color", default: defaultHeaderColor})
      )
    });
  }

  run(settings) {
    const username = $(".welcome > strong > a").text();
    const mentionColor = Util.getConfigurableValue("SQMentionColor", this, settings) ? Util.getConfigurableValue("SQMentionColor", this, settings) : this.defaultMentionColor;
    const quoteColor = Util.getConfigurableValue("SQColor", this, settings) ? Util.getConfigurableValue("SQColor", this, settings) : this.defaultQuoteColor;
    const headerColor = Util.getConfigurableValue("SQTextColor", this, settings) ? Util.getConfigurableValue("SQTextColor", this, settings) : this.defaultHeaderColor;
    // Loop quotes
    $("blockquote").each(function(index) {
      // blockquote
      $(this).css({
        "border-radius": "5px",
        "border": "1px solid black",
        "padding": "2px 6px",
        "margin-top": "10px"
      });

      // blockquote header
      const isMentioned = $(this).find("cite").text().includes(username);
      $(this).find("cite")
        .css({
          "border-radius": "5px",
          "border": "1px solid black",
          "color": headerColor,
          "background": isMentioned ? mentionColor : quoteColor,
          "font-weight": "bold"
        })
        .attr("id", `HFXSmartQuote${index}`)
        .addClass("without-after-element") // Add class to remove after element (underline)
        .find("span").css({
          "color": headerColor
        });
    });
  }
}

module.exports = new SmartQuote();
