const LineBreak = require("../configurables/LineBreak");
const Configurable = require("./Configurable");

module.exports = class ConfigurableArray {
  constructor(...configurables) {
    if (!configurables.every(configurable => configurable instanceof Configurable)) {
      throw new TypeError("Every item of a ConfigurableArray must be an instance of a Configurable.");
    }

    this.configurables = configurables;
  }

  get(id) {
    return this.configurables.find(configurable => configurable.id === id);
  }

  render(section, feature, settings) {
    return this.configurables.map(configurable => {
      if (configurable.class === LineBreak.name) {
        return "<hr>";
      }
      return `<div class="row align-items-center"><div class="col-auto">
      ${configurable.render(section, feature, settings)}
      </div></div>`;
    }).join("");
  }

  // #region Property Getter/Setters
  get configurables() {
    return this._configurables;
  }

  set configurables(_configurables) {
    this._configurables = _configurables;
  }
  // #endregion
};
