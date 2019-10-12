require("../../_core/HFX");
class ChangeBodyColor extends HFX.Feature {
  constructor () {
    super({
      section: HFX.Section.Global,
      name: "Change Body Color",
      default: 0,
      description: "Change color.",
      id: "changebodycolor"
    });
  }

  run () {
    $("table").css("color", "red");
  }
};

module.exports = new ChangeBodyColor();
