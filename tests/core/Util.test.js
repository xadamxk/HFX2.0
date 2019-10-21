global.chrome = require("sinon-chrome");
const HFX = require("../../src/HFX");

describe("Logger", () => {
  it("Error calls console.error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation();
    HFX.Logger.error("Error");
    expect(console.error).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("Warn calls console.warn", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    HFX.Logger.warn("Warn");
    expect(console.warn).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("Log calls console.log", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    HFX.Logger.log("Log");
    expect(console.log).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("Debug doesn't call console.log", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    HFX.Logger.debug("Debug", {a: "a"});
    expect(console.log).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });
});
