require("../../_core/HFX");
class HideImages extends HFX.Feature {
  constructor () {
    super({
      section: "global",
      name: "Hides images",
      default: 1,
      description: "Hides images",
      id: "hidesimages"
    });
  }

  run () {
    $("img").hide();
  }
};

module.exports = new HideImages();
