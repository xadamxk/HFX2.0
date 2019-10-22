global.chrome = require("sinon-chrome");
const HFX = require("../../src/HFX");

describe("Logger", () => {
  it("ToggleDebug works", () => {
    const startingDebugMode = HFX.Logger.debugMode;
    expect(HFX.Logger.debugMode).toBe(startingDebugMode);
    HFX.Logger.toggleDebug();
    expect(HFX.Logger.debugMode).toBe(!startingDebugMode);
    HFX.Logger.toggleDebug();
    expect(HFX.Logger.debugMode).toBe(startingDebugMode);
  });

  it("Error calls console.error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation();
    HFX.Logger.error("Error");
    HFX.Logger.error("Error", null, 1);
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(1, "[HFX] Error");
    expect(console.error).toHaveBeenNthCalledWith(2, "[HFX] Error", null, 1);
    spy.mockRestore();
  });

  it("Warn calls console.warn", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    HFX.Logger.warn("Warn");
    HFX.Logger.warn("Warn", null, 1);
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenNthCalledWith(1, "[HFX] Warn");
    expect(console.warn).toHaveBeenNthCalledWith(2, "[HFX] Warn", null, 1);
    spy.mockRestore();
  });

  it("Log calls console.log", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    HFX.Logger.log("Log");
    HFX.Logger.log("Log", null, 1);
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, "[HFX] Log");
    expect(console.log).toHaveBeenNthCalledWith(2, "[HFX] Log", null, 1);
    spy.mockRestore();
  });

  it("Debug calls console.log with DEBUG in message if debugMode is true", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    const startingDebugMode = HFX.Logger.debugMode;
    HFX.Logger.debugMode = true;

    HFX.Logger.debug("Debug");
    HFX.Logger.debug("Debug", null, 1);
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, "[HFX] DEBUG: Debug");
    expect(console.log).toHaveBeenNthCalledWith(2, "[HFX] DEBUG: Debug", null, 1);

    HFX.Logger.debugMode = false;
    spy.mockReset();

    HFX.Logger.debug("Debug");
    HFX.Logger.debug("Debug", null, 1);
    expect(console.log).toHaveBeenCalledTimes(0);

    HFX.Logger.debugMode = startingDebugMode;
    spy.mockRestore();
  });
});
