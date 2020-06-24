const HFX = require("../HFX");

module.exports = class Configurable {
  constructor(opts) {
    const required = ["id", "type", "label", "default"];
    this.class = this.constructor.name;

    for (const index in required) {
      if (opts[required[index]] === undefined) {
        HFX.Logger.error(`Not able to load ${this.class} as '${required[index]}' is missing.`);
        return;
      }
    }

    this.id = opts.id;
    this.type = opts.type;
    this.label = opts.label;
    this.default = opts.default;
  }

  render() {
    HFX.Logger.error(`Cannot render ${this.type} configurable.`, this);
    return `Cannot render ${this.type} configurable.`;
  }
};
