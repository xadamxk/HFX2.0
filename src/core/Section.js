const Util = require("./Util");

module.exports = class Section {
  constructor(...locations) {
    this.class = this.constructor.name;
    this.name = this.class.replace(/([a-z])([A-Z])/g, "$1 $2");
    this.locations = locations.length === 0 ? ["/"] : locations;
  }

  runnable() {
    return Util.isContentScript() && this.locations.some(location => document.location.pathname.startsWith(location));
  }

  // #region Property Getter/Setters
  get name() {
    return this._name;
  }

  set name(_name) {
    this._name = _name;
  }

  get locations() {
    return this._locations;
  }

  set locations(_locations) {
    this._locations = _locations;
  }
  // #endregion
};
