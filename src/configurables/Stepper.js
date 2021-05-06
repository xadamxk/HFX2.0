const Configurable = require("../core/Configurable");
const Util = require("../core/Util");

module.exports = class Stepper extends Configurable {
  constructor(opts) {
    super(Object.assign(opts, {type: "number"}));
  }

  render(section, feature, settings) {
    const value = Util.getConfigurableValue(this.id, feature, settings);

    return `
      <div class="form-check form-check-inline mr-0">
        <input type="${this.type}" 
        class="form-check-input" 
        data-section="${section.class}" 
        data-feature="${feature.class}" 
        data-setting="${this.id}" 
        step=${this.step} value="${value}">
        <label class="form-check-label">${this.label}</label>
      </div>
    `;
  }
};
