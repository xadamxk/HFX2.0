const Configurable = require("../core/Configurable");
const Util = require("../core/Util");

class Generic extends Configurable {
  render(section, feature, settings) {
    const value = Util.getConfigurableValue(this.id, feature, settings);

    return `
      <label class="mb-0">${this.label}</label>
      <input type="${this.type}" data-section="${section.class}" data-feature="${feature.class}" data-setting="${this.id}" value="${value}">
    `;
  }
};

Configurable.Generic = Generic;

module.exports = Generic;
