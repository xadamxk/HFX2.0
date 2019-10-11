module.exports = class Feature {
  constructor (opts) {
    const required = ["section", "name", "default", "description", "id"];
    const childClass = this.constructor.name;

    for (const index in required) {
      if (opts[required[index]] === undefined) {
        HFX.Logger.error(`Not able to load ${childClass} as '${required[index]}' is missing.`);
        return;
      }
    };

    if (opts.subsection === undefined) {
      opts.subsection = "general";
    }

    HFX.Settings.getFeatureSettings(opts.section, childClass, opts.default, opts.name, opts.description, opts.id, this, (settings, Feature) => {
      if (!settings) {
        HFX.Settings.create(opts.section, childClass, opts.default, opts.name, opts.description, opts.id, () => {
          if (opts.default) {
            Feature.run(opts.default);
          }
        });
      } else {
        if (settings.enabled) {
          Feature.run(settings.default);
        }
      }
    });

    HFX.Logger.debug(`${childClass} loaded.`);
  }
};
