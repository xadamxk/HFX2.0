const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");

class HideImages extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Hides Images",
      default: false,
      description: "Hides images."
    });
  }

  run() {
    $("img").hide();
  }
};

module.exports = new HideImages();
