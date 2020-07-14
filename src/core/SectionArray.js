const Section = require("./Section");

module.exports = class SectionArray {
  constructor(...sections) {
    if (!sections.every(section => section instanceof Section)) {
      throw new TypeError("Every item of a SectionArray must be an instance of a Section.");
    }

    this.sections = sections;
  }

  runnableSection() {
    return this.sections.filter(section => section.runnable()).shift();
  }

  runnable() {
    return this.sections.some(section => section.runnable());
  }

  // #region Property Getter/Setters
  get sections() {
    return this._sections;
  }

  set sections(_sections) {
    this._sections = _sections;
  }
  // #endregion
};
