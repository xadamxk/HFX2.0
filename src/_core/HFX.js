global.HFX = {};

// Make sure Logger and Util are available immediately for other modules
global.HFX.Logger = require("./Logger");
global.HFX.Util = require("./Util");

// Load other modules
global.HFX.Storage = require("./Storage");
global.HFX.Settings = require("./Settings");
global.HFX.Section = require("./Section");
global.HFX.Feature = require("./Feature");
