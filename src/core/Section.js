const HFX = require("../HFX");

module.exports = class Section {
  constructor(name, ...locations) {
    this.name = name;
    this.locations = locations.length === 0 ? ["/"] : locations;
    this.runnable = HFX.Util.isContentScript() && this.locations.some((location) => document.location.pathname.startsWith(location));
  }
};
