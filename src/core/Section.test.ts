import { Section } from "./Section";
import { SectionArray } from "./SectionArray";
import { Util } from "./Util";

const visit = (url: string) => window.history.replaceState({}, "", url);

describe("Section", () => {
  beforeEach(() => {
    jest.spyOn(Util, "isContentScript").mockReturnValue(true);
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("matches every page under a path ending in a slash", () => {
    const global = new Section(["/"]);

    visit("/index.php");
    expect(global.runnable()).toBe(true);
    visit("/showthread.php?tid=1");
    expect(global.runnable()).toBe(true);
  });

  it("matches other paths exactly", () => {
    const threads = new Section(["/showthread.php"]);

    visit("/showthread.php?tid=1");
    expect(threads.runnable()).toBe(true);
    visit("/x/showthread.php");
    expect(threads.runnable()).toBe(false);
    visit("/showthread.php.bak");
    expect(threads.runnable()).toBe(false);
  });

  it("treats paths as plain text, not regex", () => {
    const profile = new Section(["/member.php"]);

    visit("/memberXphp");
    expect(profile.runnable()).toBe(false);
    visit("/member.php");
    expect(profile.runnable()).toBe(true);
  });

  it("requires query parameters given in the path", () => {
    const profile = new Section(["/member.php?action=profile"]);

    visit("/member.php?uid=1&action=profile");
    expect(profile.runnable()).toBe(true);
    visit("/member.php?action=login");
    expect(profile.runnable()).toBe(false);
    visit("/member.php");
    expect(profile.runnable()).toBe(false);
  });

  it("requires an element selector match when selectors are given", () => {
    const section = new Section(["/usercp.php"], ["#target"]);

    visit("/usercp.php");
    expect(section.runnable()).toBe(false);

    document.body.innerHTML = `<div id="target"></div>`;
    visit("/usercp.php?action=options");
    expect(section.runnable()).toBe(true);
  });

  it("checks the page once per URL", () => {
    const section = new Section(["/usercp.php"], ["#target"]);
    const querySelector = jest.spyOn(document, "querySelector");

    visit("/usercp.php");
    section.runnable();
    section.runnable();
    expect(querySelector).toHaveBeenCalledTimes(1);

    visit("/usercp.php?action=options");
    section.runnable();
    expect(querySelector).toHaveBeenCalledTimes(2);
  });

  it("does not match with no paths or selectors", () => {
    visit("/index.php");
    expect(new Section().runnable()).toBe(false);
  });

  it("throws when paths are not an array", () => {
    expect(() => new Section("/member.php" as unknown as string[])).toThrow(
      TypeError
    );
    expect(
      () => new Section([], "#target" as unknown as string[])
    ).toThrow(TypeError);
  });
});

describe("SectionArray.runnableSection", () => {
  beforeEach(() => {
    jest.spyOn(Util, "isContentScript").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the first matching section", () => {
    const threads = new Section(["/showthread.php"]);
    const profile = new Section(["/member.php"]);
    const sections = new SectionArray(threads, profile);

    visit("/member.php");
    expect(sections.runnableSection()).toBe(profile);
    visit("/index.php");
    expect(sections.runnableSection()).toBeUndefined();
  });
});
