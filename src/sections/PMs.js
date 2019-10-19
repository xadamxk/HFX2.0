const HFX = require("../HFX");

class PMs extends HFX.Section {
  constructor() {
    super("pms", "/private.php");
  }
};

HFX.Section.PMs = new PMs();

module.exports = HFX;
