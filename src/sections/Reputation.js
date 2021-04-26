const Section = require("../core/Section");

class Reputation extends Section {
  constructor() {
    super("/reputation.php", "/repsgiven.php");
  }
}

module.exports = new Reputation();
