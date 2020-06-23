const HFX = require("../../HFX");

class ChangeBodyColor extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Global,
      name: "Change Body Color",
      default: false,
      description: "Change color.",
      configurables: [
        {
          id: "color",
          type: "color",
          label: "Color",
          default: "#ff0000"
        }
      ]
    });
  }

  run(settings) {
    $("table").css("color", HFX.Util.getConfigurableValue("color", this, settings));
  }
};

HFX.Feature.ChangeBodyColor = new ChangeBodyColor();

module.exports = HFX;
