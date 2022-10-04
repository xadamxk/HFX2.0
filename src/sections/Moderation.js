const Section = require("../core/Section");

class Moderation extends Section {
  constructor() {
    super("/modcp.php");
  }
};

module.exports = new Moderation();
