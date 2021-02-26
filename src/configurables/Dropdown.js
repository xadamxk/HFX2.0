const Configurable = require("../core/Configurable");
const Util = require("../core/Util");

module.exports = class Dropdown extends Configurable {
  constructor(opts) {
    super(Object.assign(opts, {type: "dropdown"}));
  }

  render(section, feature, settings) {
    const value = Util.getConfigurableValue(this.id, feature, settings);

    const options = this.dropdownOptions.map(option => {
      const isSavedValue = value == option.value;
      return `<option 
      value=${option.value}
      ${isSavedValue ? "selected" : ""}
      >
      ${option.label}
      </option>`;
    });

    return `
    <div class="form-check form-check-inline mr-0">
      <label class="form-check-label">${this.label}</label>
      <select 
        type="${this.type}"
        class="form-check-input" 
        data-section="${section.class}" 
        data-feature="${feature.class}"
        data-setting="${this.id}"
        id="${this.id}" 
      >
        ${options}
      </select>
    </div>
    `;
  }
};
