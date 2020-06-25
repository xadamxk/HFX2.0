const Section = require("../core/Section");

class Threads extends Section {
  constructor() {
    super("/showthread.php");
  }
};

module.exports = new Threads();
