const Generic = require("../configurables/Generic");
const Configurable = require("../core/Configurable");

class Text extends Generic {
  constructor(opts) {
    super(Object.assign(opts, {type: "text"}));
  }
};

Configurable.Text = Text;

module.exports = Text;
