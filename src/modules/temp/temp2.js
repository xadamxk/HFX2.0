require("../../_core/HFX");
class Temp2 extends HFX.Feature {
  constructor() {
    super({
      section: "temp",
      name: "temp2",
      default: 0,
      description: "Temp2",
      id: "temp2"
    });
  }

  run() {
    console.log("TEMP 2");
  }
};

module.exports = new Temp2();
