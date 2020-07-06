const Generic = require("../configurables/Generic");

module.exports = class Color extends Generic {
  constructor(opts) {
    super(Object.assign(opts, {type: "color"}));
  }
};
