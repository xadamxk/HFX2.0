const HFX = require("../HFX");

class Reputation extends HFX.Section {
  constructor() {
    super("reputation", "/reputation.php", "/repsgiven.php");
  }
};

HFX.Section.Reputation = new Reputation();

module.exports = HFX;
