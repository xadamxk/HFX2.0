const HFX = require("../../HFX");
const Color = require("../../configurables/Color");

class ChangeBodyColor extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Global,
      name: "Change Body Color",
      default: false,
      description: "Change color.",
      configurables: [
        new Color({id: "color", label: "Color", default: "#ff0000"})
      ]
    });
  }

  run(settings) {
    $("table").css("color", HFX.Util.getConfigurableValue("color", this, settings));
  }
};

HFX.Feature.ChangeBodyColor = new ChangeBodyColor();

module.exports = HFX;
