const Section = require("../core/Section");

class awards extends Section {
  constructor() {
    super("/myawards.php");
  }
};

module.exports = new awards();
