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

    HFX.Settings.getFeatureSettings(opts.section.name, childClass, opts.default, opts.name, opts.description, opts.id, opts.author, this, (settings, Feature) => {
      if (!settings) {
        HFX.Settings.create(opts.section.name, childClass, opts.default, opts.name, opts.description, opts.id, opts.author, () => {
          HFX.Logger.debug(`${childClass} loaded.`);
          if (opts.default && opts.section.runnable) {
            Feature.run(opts.default);
            HFX.Logger.debug(`${childClass} running.`);
          }
        });
      } else {
        HFX.Logger.debug(`${childClass} loaded.`);
        if (settings.enabled && opts.section.runnable) {
          Feature.run(settings.default);
          HFX.Logger.debug(`${childClass} running.`);
        }
      }
    });
  }
};
