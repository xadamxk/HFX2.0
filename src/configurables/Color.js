const HFX = require("../HFX");
const Generic = require("../configurables/Generic");

class Color extends Generic {
  constructor(opts) {
    super(Object.assign(opts, {type: "color"}));
  }
};

HFX.Configurable.Color = Color;

module.exports = Color;
