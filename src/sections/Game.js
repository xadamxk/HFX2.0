const Section = require("../core/Section");

class Game extends Section {
  constructor() {
    super("/gamecp.php");
  }
};

module.exports = new Game();
