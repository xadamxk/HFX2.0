module.exports = class Configurable {
  constructor(opts) {
    const required = ["id", "type", "label", "default"];
    this.class = this.constructor.name;

    for (const index in required) {
      if (opts[required[index]] === undefined) {
        throw new Error(`Not able to load ${this.class} as '${required[index]}' is missing.`);
      }
    }

    this.id = opts.id;
    this.type = opts.type;
    this.label = opts.label;
    this.default = opts.default;
  }

  render() {
    return `Cannot render ${this.type} configurable.`;
  }
};
