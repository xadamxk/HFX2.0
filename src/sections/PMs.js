const HFX = require("../HFX");

class PMs extends HFX.Section {
  constructor() {
    super("/private.php");
  }
};

HFX.Section.PMs = new PMs();

module.exports = HFX;
