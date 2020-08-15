const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Color = require("../../configurables/Color");
const Util = require("../../core/Util");

class SmartQuote extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Smart Quote",
      default: true,
      description: "Adds styling and highlights mentioned quotes.",
      configurables: new ConfigurableArray(
        new Color({id: "SQMentionColor", label: "Mention Color", default: "#FF3B30"}),
        new Color({id: "SQColor", label: "Quote Color", default: "#B1D8BF"})
      )
    });
  }

  run(settings) {
    $("blockquote").each(function() {
      console.log(this);
      $(this).css({
        "border-radius": "5px",
        "border": "1px solid black",
        "padding": "1px 4px"
      });
      $(this).find("cite").css({
        "border-radius": "5px",
        "padding": "2px 8px 2px 8px",
        "border": "1px solid black",
        "": "",
        "background": Util.getConfigurableValue("SQColor", this, settings)
      });
    });
  }
};

module.exports = new SmartQuote();
