const Section = require("../core/Section");

class Global extends Section {
  constructor() {
    super("/");
  }
}

module.exports = new Global();
