const Section = require("../core/Section");

class Groups extends Section {
  constructor() {
    super("/showgroups.php");
  }
};

module.exports = new Groups();
