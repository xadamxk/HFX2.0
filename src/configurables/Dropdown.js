const Configurable = require("../core/Configurable");
const Util = require("../core/Util");
const Option = require("../models/option.js");
module.exports = class Dropdown extends Configurable {
  constructor(opts) {
    super(Object.assign(opts, {type: "dropdown"}));
  }

  render(section, feature, settings) {
    const value = Util.getConfigurableValue(this.id, feature, settings);
    const options = this.dropdownOptions &&
    this.dropdownOptions !== [] &&
    this.dropdownOptions.length > 0 &&
    this.dropdownOptions.map(optionEntry => {
      const option = new Option(optionEntry.value, optionEntry.label);
      const isSavedValue = value === option.value;
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
        ${options === null || options === [] || options.length <= 0 ? "disabled" : ""} 
      >
        ${options}
      </select>
    </div>
    `;
  }
};
