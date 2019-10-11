require("../../_core/HFX");
class Temp1 extends HFX.Feature {
  constructor() {
    super({
      section: "temp",
      name: "temp1",
      default: 0,
      description: "Temp1",
      id: "temp1"
    });
  }

  run() {
    console.log("TEMP 1");
  }
};

module.exports = new Temp1();
