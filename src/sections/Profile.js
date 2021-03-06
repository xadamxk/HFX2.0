const Section = require("../core/Section");

class Profile extends Section {
  constructor() {
    super("/member.php");
  }
};

module.exports = new Profile();
