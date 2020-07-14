const Logger = require("./Logger");
const Settings = require("./Settings");
const Util = require("./Util");
const Section = require("./Section");
const ConfigurableArray = require("./ConfigurableArray");
const SectionArray = require("./SectionArray");

module.exports = class Feature {
  constructor(opts) {
    this.class = this.constructor.name;

    const required = Util.checkParameters({
      "section": Section,
      "name": "string",
      "default": "boolean",
      "description": "string"
    }, opts);

    const optional = Util.checkParameters({
      "subsection": "string",
      "author": {
        "name": "string",
        "profile": "string"
      },
      "configurables": ConfigurableArray,
      "additionalSections": SectionArray
    }, opts);

    if (required.unset.length > 0 || required.invalid.length > 0 || optional.invalid.length > 0) {
      const errors = [
        required.unset.map(parameter => `${parameter} is missing`).join(", "),
        required.invalid.map(parameter => `${parameter} is invalid`).join(", "),
        optional.invalid.map(parameter => `${parameter} is invalid`).join(", ")
      ].filter(error => error.length > 0).join(", ");

      throw new Error(`Unable to instantiate ${this.class} due to incorrect options. (${errors})`);
    }

    this.section = opts.section;
    this.name = opts.name;
    this.default = opts.default;
    this.description = opts.description;

    this.subsection = opts.subsection;
    this.author = opts.author;
    this.configurables = opts.configurables;
    this.additionalSections = opts.additionalSections;
  }

  initialize() {
    return new Promise(resolve => {
      Settings.get(this, settings => {
        if (settings === undefined) {
          Settings.create(this, settings => {
            resolve(settings);
          });
        } else {
          resolve(settings);
        }
      });
    });
  }

  start() {
    return this.initialize().then(settings => {
      Util.trackLoadedFeature(this);
      Logger.debug(`${this.class} loaded.`);

      if (settings.enabled && this.runnable()) {
        this.run(settings, this.runnableSection());
        Logger.debug(`${this.class} running.`);
        return true;
      }

      return false;
    });
  }

  runnableSection() {
    return this.section.runnable() ? this.section : (this.additionalSections && this.additionalSections.runnableSection());
  }

  runnable() {
    return this.section.runnable() || (this.additionalSections && this.additionalSections.runnable());
  }

  run() {
    throw new Error(`Running has not been implemented for ${this.name} feature.`);
  }

  // #region Property Getter/Setters
  get section() {
    return this._section;
  }

  set section(_section) {
    this._section = _section;
  }

  get name() {
    return this._name;
  }

  set name(_name) {
    this._name = _name;
  }

  get default() {
    return this._default;
  }

  set default(_default) {
    this._default = _default;
  }

  get description() {
    return this._description;
  }

  set description(_description) {
    this._description = _description;
  }

  get subsection() {
    return this._subsection;
  }

  set subsection(_subsection) {
    this._subsection = _subsection;
  }

  get author() {
    return this._author;
  }

  set author(_author) {
    this._author = _author;
  }

  get configurables() {
    return this._configurables;
  }

  set configurables(_configurables) {
    this._configurables = _configurables;
  }

  get additionalSections() {
    return this._additionalSections;
  }

  set additionalSections(_additionalSections) {
    this._additionalSections = _additionalSections;
  }
  // #endregion
};
