const HFX = require("../HFX");

class Threads extends HFX.Section {
  constructor() {
    super("/showthread.php");
  }
};

HFX.Section.Threads = new Threads();

module.exports = HFX;
