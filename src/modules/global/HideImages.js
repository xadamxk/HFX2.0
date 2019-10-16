class HideImages extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Global,
      name: "Hides images",
      default: false,
      description: "Hides images",
      id: "hidesimages"
    });
  }

  run() {
    $("img").hide();
  }
};

module.exports = new HideImages();
