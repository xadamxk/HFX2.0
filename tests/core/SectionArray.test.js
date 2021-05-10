global.chrome = require("sinon-chrome");
const Section = require("../../src/core/Section");
const SectionArray = require("../../src/core/SectionArray");
const Util = require("../../src/core/Util");

const firstSection = new Section("/first-page");
const secondSection = new Section("/second-page");

const sectionArray = new SectionArray(firstSection, secondSection);

describe("SectionArray", () => {
  beforeEach(() => {
    window.history.pushState({}, "Index", "/");
    jest.restoreAllMocks();
  });

  it("requires every item to be a Section", () => {
    expect(() => {
      new SectionArray("not a section"); // eslint-disable-line no-new
    }).toThrow("Every item of a SectionArray must be an instance of a Section.");
  });

  it("behaves correctly without any sections", () => {
    const sectionArray = new SectionArray();
    expect(sectionArray.runnable()).toBe(false);
    expect(sectionArray.runnableSection()).toBe(undefined);
  });

  it("is runnable on matching (sub)paths in content script", () => {
    jest.spyOn(Util, "isContentScript").mockReturnValue(true);

    window.history.pushState({}, "First Page", "/first-page");
    expect(sectionArray.runnable()).toBe(true);
    expect(sectionArray.runnableSection()).toStrictEqual(firstSection);

    window.history.pushState({}, "Second Page - Subpage", "/second-page/subpage");
    expect(sectionArray.runnable()).toBe(true);
    expect(sectionArray.runnableSection()).toStrictEqual(secondSection);
  });

  it("is not runnable on matching (sub)paths outside content script", () => {
    jest.spyOn(Util, "isContentScript").mockReturnValue(false);

    window.history.pushState({}, "First Page", "/first-page");
    expect(sectionArray.runnable()).toBe(false);
    expect(sectionArray.runnableSection()).toBe(undefined);

    window.history.pushState({}, "Second Page - Subpage", "/second-page/subpage");
    expect(sectionArray.runnable()).toBe(false);
    expect(sectionArray.runnableSection()).toBe(undefined);
  });

  it("is not runnable on non-matching (sub)paths", () => {
    jest.spyOn(Util, "isContentScript").mockReturnValue(true);

    window.history.pushState({}, "Index", "/");
    expect(sectionArray.runnable()).toBe(false);
    expect(sectionArray.runnableSection()).toBe(undefined);

    window.history.pushState({}, "Third Page - Subpage", "/third-page/subpage");
    expect(sectionArray.runnable()).toBe(false);
    expect(sectionArray.runnableSection()).toBe(undefined);
  });
});
