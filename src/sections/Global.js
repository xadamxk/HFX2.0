const HFX = require("../HFX");

class Global extends HFX.Section {
  constructor() {
    super("/");
  }
};

HFX.Section.Global = new Global();

module.exports = HFX;
