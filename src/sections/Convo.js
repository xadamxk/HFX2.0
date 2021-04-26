const Section = require("../core/Section");

class Convo extends Section {
  constructor() {
    super("/convo.php");
  }
}

module.exports = new Convo();
