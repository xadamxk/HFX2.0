const Section = require("../core/Section");

class ForumDisplay extends Section {
  constructor() {
    super("/forumdisplay.php");
  }
};

module.exports = new ForumDisplay();
