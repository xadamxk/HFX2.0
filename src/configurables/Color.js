const Configurable = require("../core/Configurable");
const Generic = require("../configurables/Generic");

class Color extends Generic {
  constructor(opts) {
    super(Object.assign(opts, {type: "color"}));
  }
};

Configurable.Color = Color;

module.exports = Color;
