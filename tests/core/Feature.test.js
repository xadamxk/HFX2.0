global.chrome = require("sinon-chrome");
const Feature = require("../../src/core/Feature");
const Section = require("../../src/core/Section");
const ConfigurableArray = require("../../src/core/ConfigurableArray");

const section = new Section("/");

const opts = {
  section: section,
  name: "name",
  default: false,
  description: "description",
  subsection: "subsection",
  author: {
    name: "author.name",
    profile: "author.profile"
  },
  configurables: new ConfigurableArray()
};

const feature = new Feature(opts);

describe("Feature", () => {
  beforeEach(() => {
    chrome.storage.local.get.reset();
    chrome.storage.local.set.reset();
    jest.restoreAllMocks();
  });

  it("requires section", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.section;

    expect(() => {
      new Feature(partialOpts); // eslint-disable-line no-new
    }).toThrow("(section is missing)");
  });

  it("requires section to be a Section", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.section = "not a section";

    expect(() => {
      new Feature(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(section is invalid)");
  });

  it("requires name", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.name;

    expect(() => {
      new Feature(partialOpts); // eslint-disable-line no-new
    }).toThrow("(name is missing)");
  });

  it("requires name to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.name = null;

    expect(() => {
      new Feature(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(name is invalid)");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Feature(partialOpts); // eslint-disable-line no-new
    }).toThrow("(default is missing)");
  });

  it("requires default to be a boolean", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.default = "default";

    expect(() => {
      new Feature(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(default is invalid)");
  });

  it("requires description", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.description;

    expect(() => {
      new Feature(partialOpts); // eslint-disable-line no-new
    }).toThrow("(description is missing)");
  });

  it("requires description to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.description = null;

    expect(() => {
      new Feature(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(description is invalid)");
  });

  it("requires subsection to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.subsection = null;

    expect(() => {
      new Feature(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(subsection is invalid)");
  });

  it("requires author name to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.author = Object.assign({}, opts.author);
    invalidOpts.author.name = null;

    expect(() => {
      new Feature(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(author.name is invalid)");
  });

  it("requires author profile to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.author = Object.assign({}, opts.author);
    invalidOpts.author.profile = null;

    expect(() => {
      new Feature(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(author.profile is invalid)");
  });

  it("requires configurables to be a ConfigurableArray", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.configurables = null;

    expect(() => {
      new Feature(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(configurables is invalid)");
  });

  it("sets properties", () => {
    expect(feature.section).toBe(opts.section);
    expect(feature.name).toBe(opts.name);
    expect(feature.default).toBe(opts.default);
    expect(feature.description).toBe(opts.description);
    expect(feature.subsection).toBe(opts.subsection);
    expect(feature.author).toBe(opts.author);
    expect(feature.configurables).toBe(opts.configurables);
  });

  it("initializes with empty storage", async() => {
    chrome.storage.local.get.callsArgWith(1, {});
    chrome.storage.local.set.callsArg(1);

    expect.assertions(1);

    const settings = await feature.initialize();
    expect(settings).toStrictEqual({
      enabled: feature.default
    });
  });

  it("initializes with storage", async() => {
    const storage = {};
    storage[feature.class] = {
      enabled: !feature.default
    };

    chrome.storage.local.get.callsArgWith(1, storage);
    chrome.storage.local.set.callsArg(1);

    expect.assertions(1);

    const settings = await feature.initialize();
    expect(settings).toStrictEqual(storage[feature.class]);
  });

  it("starts without storage and enabled by default", async() => {
    chrome.storage.local.get.callsArgWith(1, {});
    chrome.storage.local.set.callsArg(1);
    jest.spyOn(feature.section, "runnable").mockReturnValue(true);
    jest.spyOn(feature, "run").mockImplementation();
    jest.spyOn(feature, "default", "get").mockReturnValue(true);

    expect.assertions(1);

    expect(await feature.start()).toBe(true);
  });

  it("does not start without storage and disabled by default", async() => {
    chrome.storage.local.get.callsArgWith(1, {});
    chrome.storage.local.set.callsArg(1);
    jest.spyOn(feature.section, "runnable").mockReturnValue(true);
    jest.spyOn(feature, "run").mockImplementation();
    jest.spyOn(feature, "default", "get").mockReturnValue(false);

    expect.assertions(1);

    expect(await feature.start()).toBe(false);
  });

  it("starts with enabled in storage and disabled by default", async() => {
    const storage = {};
    storage[feature.class] = {
      enabled: true
    };

    chrome.storage.local.get.callsArgWith(1, storage);
    chrome.storage.local.set.callsArg(1);
    jest.spyOn(feature.section, "runnable").mockReturnValue(true);
    jest.spyOn(feature, "run").mockImplementation();
    jest.spyOn(feature, "default", "get").mockReturnValue(false);

    expect.assertions(1);

    expect(await feature.start()).toBe(true);
  });

  it("does not start with disabled in storage and enabled by default", async() => {
    const storage = {};
    storage[feature.class] = {
      enabled: false
    };

    chrome.storage.local.get.callsArgWith(1, storage);
    chrome.storage.local.set.callsArg(1);
    jest.spyOn(feature.section, "runnable").mockReturnValue(true);
    jest.spyOn(feature, "run").mockImplementation();
    jest.spyOn(feature, "default", "get").mockReturnValue(true);

    expect.assertions(1);

    expect(await feature.start()).toBe(false);
  });

  it("requires runner", () => {
    expect(() => {
      feature.run();
    }).toThrow(`Running has not been implemented for ${feature.name} feature.`);
  });
});
