global.chrome = require("sinon-chrome");
const Section = require("../../src/core/Section");
const Util = require("../../src/core/Util");

describe("Section", () => {
  beforeEach(() => {
    window.history.pushState({}, "Index", "/");
    jest.restoreAllMocks();
  });

  it("is runnable on matching (sub)paths in content script", () => {
    jest.spyOn(Util, "isContentScript").mockReturnValue(true);
    const section = new Section("/page");

    window.history.pushState({}, "Page", "/page");
    expect(section.runnable()).toBe(true);

    window.history.pushState({}, "Page - Subpage", "/page/subpage");
    expect(section.runnable()).toBe(true);
  });

  it("is not runnable on matching (sub)paths outside content script", () => {
    jest.spyOn(Util, "isContentScript").mockReturnValue(false);
    const section = new Section("/page");

    window.history.pushState({}, "Page", "/page");
    expect(section.runnable()).toBe(false);

    window.history.pushState({}, "Page - Subpage", "/page/subpage");
    expect(section.runnable()).toBe(false);
  });

  it("is not runnable on non-matching (sub)paths", () => {
    jest.spyOn(Util, "isContentScript").mockReturnValue(true);
    const section = new Section("/another-page");

    window.history.pushState({}, "Page", "/page");
    expect(section.runnable()).toBe(false);

    window.history.pushState({}, "Page - Subpage", "/page/subpage");
    expect(section.runnable()).toBe(false);
  });

  it("sets name and locations", () => {
    const locations = ["/1", "/2", "/3"];
    const section = new Section(...locations);
    expect(section.name).toBe(section.class);
    expect(section.locations).toStrictEqual(locations);
  });

  it("defaults locations to root", () => {
    const section = new Section();
    expect(section.locations).toStrictEqual(["/"]);
  });
});
