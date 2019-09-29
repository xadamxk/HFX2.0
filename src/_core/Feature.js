module.exports = class Feature {
  constructor (opts) {
    var required = ["section", "name", "default", "description", "id"];
    var childClass = this.constructor.name;

    for (var index in required) {
      if (opts[required[index]] === undefined) {
        HFX.Logger.error(`Not able to load ${childClass} as '${required[index]}' is missing.`);
        return;
      }
    };

    if (opts.subsection === undefined) {
      opts.subsection = "general";
    }

    HFX.Settings.getFeatureSettings(opts.section, childClass, opts.default, opts.name, opts.description, opts.id, this, function (settings, Feature) {
      if (!settings) {
        if (opts.default) {
          Feature.run(opts.default);
        }
        HFX.Settings.create(opts.section, childClass, opts.default, opts.name, opts.description, opts.id);
      } else {
        if (settings.enabled) {
          Feature.run(settings.default);
        }
      }
    });

    HFX.Logger.debug(`${childClass} loaded.`);
  }
};
