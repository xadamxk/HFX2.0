const Section = require("../core/Section");

class PMs extends Section {
  constructor() {
    super("/private.php");
  }
}

module.exports = new PMs();
