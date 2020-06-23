const HFX = require("../../HFX");

class HideImages extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Global,
      name: "Hides images",
      default: false,
      description: "Hides images"
    });
  }

  run() {
    $("img").hide();
  }
};

HFX.Feature.HideImages = new HideImages();

module.exports = HFX;
