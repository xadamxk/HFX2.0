global.chrome = require("sinon-chrome");
const Dropdown = require("../../src/configurables/Dropdown");
const Section = require("../../src/core/Section");
const Feature = require("../../src/core/Feature");
const ConfigurableArray = require("../../src/core/ConfigurableArray");
const Option = require("../../src/models/option");

const opts = {
  id: "id",
  label: "label",
  default: "something",
  dropdownOptions: [new Option("0", "Option 0"), new Option("1", "Option 1")]
};
const settings = {};
settings[opts.id] = "else";

const configurable = new Dropdown(opts);
const section = new Section("/");
const feature = new Feature({
  section: section,
  name: "name",
  default: false,
  description: "description",
  configurables: new ConfigurableArray(configurable)
});

describe("Dropdown", () => {
  it("requires id", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.id;

    expect(() => {
      new Dropdown(partialOpts); // eslint-disable-line no-new
    }).toThrow("(id is missing)");
  });

  it("requires id to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.id = null;

    expect(() => {
      new Dropdown(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(id is invalid)");
  });

  it("ignores type", () => {
    const extraOpts = Object.assign({type: "not dropdown"}, opts);
    const extraConfigurable = new Dropdown(extraOpts);
    expect(extraConfigurable.type).toBe("dropdown");
  });

  it("requires label", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.label;

    expect(() => {
      new Dropdown(partialOpts); // eslint-disable-line no-new
    }).toThrow("(label is missing)");
  });

  it("requires label to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.label = null;

    expect(() => {
      new Dropdown(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(label is invalid)");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Dropdown(partialOpts); // eslint-disable-line no-new
    }).toThrow("(default is missing)");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe("dropdown");
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
  });

  it("renders without settings", () => {
    let partialOpts = {...opts};
    partialOpts.dropdownOptions = null;
    let partialConfigurable = new Dropdown(partialOpts);
    const rendered = new DOMParser().parseFromString(partialConfigurable.render(section, feature), "text/html").body;
    const input = rendered.querySelector("select");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("select-one");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(input.disabled).toBe(true);
    expect(label.innerHTML).toBe(opts.label);
  });

  it("renders with empty settings", () => {
    let partialOpts = {...opts};
    partialOpts.dropdownOptions = null;
    let partialConfigurable = new Dropdown(partialOpts);
    const rendered = new DOMParser().parseFromString(partialConfigurable.render(section, feature, {}), "text/html").body;
    const input = rendered.querySelector("select");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("select-one");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(input.disabled).toBe(true);
    expect(label.innerHTML).toBe(opts.label);
  });

  it("renders with settings", () => {
    const rendered = new DOMParser().parseFromString(configurable.render(section, feature, settings), "text/html").body;
    const input = rendered.querySelector("select");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("select-one");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(input.disabled).toBe(false);
    expect(label.innerHTML).toBe(opts.label);
  });
});
