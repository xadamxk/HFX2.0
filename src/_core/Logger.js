class Logger {
  constructor () {
    this.debugMode = true;
  }
  error (message, ...opts) {
    console.error(`[HFX] ${message}`, (opts.length > 0 ? opts : ""));
  }

  log (message, ...opts) {
    console.log(`[HFX] ${message}`, (opts.length > 0 ? opts : ""));
  }

  debug (message, ...opts) {
    if (this.debugMode) {
      console.log(`[HFX] DEBUG: ${message}`, (opts.length > 0 ? opts : ""));
    }
  }
};

module.exports = new Logger();
