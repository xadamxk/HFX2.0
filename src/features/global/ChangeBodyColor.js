const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");
const Color = require("../../configurables/Color");
const Util = require("../../core/Util");

class ChangeBodyColor extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Change Body Color",
      default: false,
      description: "Change color.",
      configurables: [
        new Color({id: "color", label: "Color", default: "#ff0000"})
      ]
    });
  }

  run(settings) {
    $("table").css("color", Util.getConfigurableValue("color", this, settings));
  }
};

module.exports = new ChangeBodyColor();
