const Section = require("../core/Section");

class API extends Section {
  constructor() {
    super("/");
  }
};

module.exports = new API();
