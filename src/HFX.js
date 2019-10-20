const Util = require("./core/Util");
const Logger = require("./core/Logger");
const Storage = require("./core/Storage");
const Settings = require("./core/Settings");
const Section = require("./core/Section");
const Feature = require("./core/Feature");

module.exports.Util = new Util();
module.exports.Logger = new Logger();
module.exports.Storage = new Storage();
module.exports.Settings = new Settings();
module.exports.Section = Section;
module.exports.Feature = Feature;
