const Generic = require("../configurables/Generic");

module.exports = class Text extends Generic {
  constructor(opts) {
    super(Object.assign(opts, {type: "text"}));
  }
};
