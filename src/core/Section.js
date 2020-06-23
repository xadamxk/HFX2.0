const HFX = require("../HFX");

module.exports = class Section {
  constructor(...locations) {
    this.class = this.constructor.name;
    this.name = this.class;
    this.locations = locations.length === 0 ? ["/"] : locations;
    this.runnable = HFX.Util.isContentScript() && this.locations.some((location) => document.location.pathname.startsWith(location));
  }
};
