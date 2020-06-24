module.exports.Util = require("./core/Util");
module.exports.Logger = require("./core/Logger");
module.exports.Storage = require("./core/Storage");
module.exports.Settings = require("./core/Settings");
module.exports.Section = require("./core/Section");
module.exports.Feature = require("./core/Feature");
module.exports.Configurable = require("./core/Configurable");

module.exports.Storage.start();

module.exports.Sections = require("./Sections");
module.exports.Features = require("./Features");
module.exports.Configurables = require("./Configurables");
