const Util = require("../core/Util");

module.exports = class Section {
  constructor(...locations) {
    this.class = this.constructor.name;
    this.name = this.class;
    this.locations = locations.length === 0 ? ["/"] : locations;
    this.runnable = Util.isContentScript() && this.locations.some((location) => document.location.pathname.startsWith(location));
  }
};
