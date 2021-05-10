const Section = require("../core/Section");

class Awards extends Section {
  constructor() {
    super("/myawards.php");
  }
}

module.exports = new Awards();
