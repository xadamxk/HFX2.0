module.exports = class Feature {
  constructor(opts) {
    const required = ["section", "name", "default", "description", "id"];
    this.class = this.constructor.name;

    for (const index in required) {
      if (opts[required[index]] === undefined) {
        HFX.Logger.error(`Not able to load ${this.class} as '${required[index]}' is missing.`);
        return;
      }
    };

    this.section = opts.section;
    this.name = opts.name;
    this.default = opts.default;
    this.description = opts.description;
    this.id = opts.id;

    if (opts.subsection === undefined) {
      this.subsection = "general";
    }

    HFX.Settings.getFeatureSettings(this.section.name, this.class, (settings) => {
      if (settings === null) {
        HFX.Settings.create(this.section.name, this.class, this.default, this.name, this.description, this.id, this.author, () => {
          HFX.Logger.debug(`${this.class} loaded.`);
          HFX.Util.trackLoadedFeature(this);
          if (this.default && this.section.runnable) {
            this.run(this.default);
            HFX.Logger.debug(`${this.class} running.`);
          }
        });
      } else {
        HFX.Logger.debug(`${this.class} loaded.`);
        HFX.Util.trackLoadedFeature(this);
        if (settings.enabled && this.section.runnable) {
          this.run(settings.default);
          HFX.Logger.debug(`${this.class} running.`);
        }
      }
    });
  }
};
