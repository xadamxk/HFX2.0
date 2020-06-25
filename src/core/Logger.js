const Util = require("./Util");

module.exports = {
  debugMode: Util.isDevelopment(),

  toggleDebug() {
    this.debugMode = !this.debugMode;
  },

  error(message, ...opts) {
    console.error(...[`[HFX] ${message}`, ...opts]);
  },

  warn(message, ...opts) {
    console.warn(...[`[HFX] ${message}`, ...opts]);
  },

  log(message, ...opts) {
    console.log(...[`[HFX] ${message}`, ...opts]);
  },

  debug(message, ...opts) {
    if (this.debugMode) {
      console.log(...[`[HFX] DEBUG: ${message}`, ...opts]);
    }
  }
};
