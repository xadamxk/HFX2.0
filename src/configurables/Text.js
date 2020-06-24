const HFX = require("../HFX");
const Generic = require("../configurables/Generic");

class Text extends Generic {
  constructor(opts) {
    super(Object.assign(opts, {type: "text"}));
  }
};

HFX.Configurable.Text = Text;

module.exports = Text;
