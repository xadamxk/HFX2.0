const Configurable = require("../core/Configurable");
const Util = require("../core/Util");

module.exports = class Checkbox extends Configurable {
  constructor(opts) {
    super(Object.assign(opts, {type: "checkbox"}));
  }

  render(section, feature, settings) {
    const value = Util.getConfigurableValue(this.id, feature, settings);

    return `
      <div class="form-check form-check-inline mr-0">
        <input type="${this.type}" class="form-check-input" data-section="${section.class}" data-feature="${feature.class}" data-setting="${this.id}" ${value ? "checked" : ""}>
        <label class="form-check-label">${this.label}</label>
      </div>
    `;
  }
};
