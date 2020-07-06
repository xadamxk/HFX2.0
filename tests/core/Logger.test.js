global.chrome = require("sinon-chrome");
const Logger = require("../../src/core/Logger");

describe("Logger", () => {
  it("ToggleDebug works", () => {
    const startingDebugMode = Logger.debugMode;
    expect(Logger.debugMode).toBe(startingDebugMode);
    Logger.toggleDebug();
    expect(Logger.debugMode).toBe(!startingDebugMode);
    Logger.toggleDebug();
    expect(Logger.debugMode).toBe(startingDebugMode);
  });

  it("Error calls console.error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation();
    Logger.error("Error");
    Logger.error("Error", null, 1);
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(1, "[HFX] Error");
    expect(console.error).toHaveBeenNthCalledWith(2, "[HFX] Error", null, 1);
    spy.mockRestore();
  });

  it("Warn calls console.warn", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    Logger.warn("Warn");
    Logger.warn("Warn", null, 1);
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenNthCalledWith(1, "[HFX] Warn");
    expect(console.warn).toHaveBeenNthCalledWith(2, "[HFX] Warn", null, 1);
    spy.mockRestore();
  });

  it("Log calls console.log", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    Logger.log("Log");
    Logger.log("Log", null, 1);
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, "[HFX] Log");
    expect(console.log).toHaveBeenNthCalledWith(2, "[HFX] Log", null, 1);
    spy.mockRestore();
  });

  it("Debug calls console.log with DEBUG in message if debugMode is true", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    const startingDebugMode = Logger.debugMode;
    Logger.debugMode = true;

    Logger.debug("Debug");
    Logger.debug("Debug", null, 1);
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, "[HFX] DEBUG: Debug");
    expect(console.log).toHaveBeenNthCalledWith(2, "[HFX] DEBUG: Debug", null, 1);

    Logger.debugMode = false;
    spy.mockReset();

    Logger.debug("Debug");
    Logger.debug("Debug", null, 1);
    expect(console.log).toHaveBeenCalledTimes(0);

    Logger.debugMode = startingDebugMode;
    spy.mockRestore();
  });
});
