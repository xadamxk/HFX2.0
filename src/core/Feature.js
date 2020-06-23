const HFX = require("../HFX");

module.exports = class Feature {
  constructor(opts) {
    const required = ["section", "name", "default", "description"];
    this.class = this.constructor.name;

    for (const index in required) {
      if (opts[required[index]] === undefined) {
        HFX.Logger.error(`Not able to load ${this.class} as '${required[index]}' is missing.`);
        return;
      }
    }

    this.section = opts.section;
    this.name = opts.name;
    this.default = opts.default;
    this.description = opts.description;

    this.subsection = opts.subsection ? opts.subsection : "general";
    this.author = opts.author;
    this.configurables = opts.configurables;

    HFX.Settings.get(this, (settings) => {
      if (settings === undefined) {
        HFX.Settings.create(this, (settings) => {
          this.start(settings);
        });
      } else {
        this.start(settings);
      }
    });
  }

  start(settings) {
    HFX.Util.trackLoadedFeature(this);
    HFX.Logger.debug(`${this.class} loaded.`);

    if (settings.enabled && this.section.runnable) {
      this.run(settings);
      HFX.Logger.debug(`${this.class} running.`);
    }
  }
};
