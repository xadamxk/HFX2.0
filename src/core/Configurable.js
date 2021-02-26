const Util = require("./Util");

module.exports = class Configurable {
  constructor(opts) {
    this.class = this.constructor.name;

    const required = Util.checkParameters({
      "id": "string",
      "type": "string",
      "label": "string",
      "default": undefined // TODO: Default primitive/class based on type option
    }, opts);

    if (required.unset.length > 0 || required.invalid.length > 0) {
      const errors = [
        required.unset.map(parameter => `${parameter} is missing`).join(", "),
        required.invalid.map(parameter => `${parameter} is invalid`).join(", ")
      ].filter(error => error.length > 0).join(", ");

      throw new Error(`Unable to instantiate ${this.class} due to incorrect options. (${errors})`);
    }

    this.id = opts.id;
    this.type = opts.type;
    this.label = opts.label;
    this.step = opts.step;
    this.dropdownOptions = opts.dropdownOptions;
    this.default = opts.default;
  }

  render() {
    throw new Error(`Rendering has not been implemented for ${this.type} configurable.`);
  }

  // #region Property Getter/Setters
  get id() {
    return this._id;
  }

  set id(_id) {
    this._id = _id;
  }

  get type() {
    return this._type;
  }

  set type(_type) {
    this._type = _type;
  }

  get label() {
    return this._label;
  }

  set label(_label) {
    this._label = _label;
  }

  get step() {
    return this._step;
  }

  set step(_step) {
    this._step = _step;
  }

  get dropdownOptions() {
    return this._dropdownOptions;
  }

  set dropdownOptions(_dropdownOptions) {
    this._dropdownOptions = _dropdownOptions;
  }

  get default() {
    return this._default;
  }

  set default(_default) {
    this._default = _default;
  }
  // #endregion
};
