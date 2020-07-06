global.chrome = require("sinon-chrome");
const Checkbox = require("../../src/configurables/Checkbox");
const Section = require("../../src/core/Section");
const Feature = require("../../src/core/Feature");
const ConfigurableArray = require("../../src/core/ConfigurableArray");

const opts = {
  id: "id",
  label: "label",
  default: false
};
const settings = {};
settings[opts.id] = !opts.default;

const configurable = new Checkbox(opts);
const section = new Section("/");
const feature = new Feature({
  section: section,
  name: "name",
  default: false,
  description: "description",
  configurables: new ConfigurableArray(configurable)
});

describe("Checkbox", () => {
  it("requires id", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.id;

    expect(() => {
      new Checkbox(partialOpts); // eslint-disable-line no-new
    }).toThrow("(id is missing)");
  });

  it("requires id to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.id = null;

    expect(() => {
      new Checkbox(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(id is invalid)");
  });

  it("ignores type", () => {
    const extraOpts = Object.assign({type: "not checkbox"}, opts);
    const extraConfigurable = new Checkbox(extraOpts);
    expect(extraConfigurable.type).toBe("checkbox");
  });

  it("requires label", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.label;

    expect(() => {
      new Checkbox(partialOpts); // eslint-disable-line no-new
    }).toThrow("(label is missing)");
  });

  it("requires label to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.label = null;

    expect(() => {
      new Checkbox(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(label is invalid)");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Checkbox(partialOpts); // eslint-disable-line no-new
    }).toThrow("(default is missing)");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe("checkbox");
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
  });

  it("renders without settings", () => {
    const rendered = new DOMParser().parseFromString(configurable.render(section, feature), "text/html").body;
    const input = rendered.querySelector("input");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("checkbox");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(input.checked).toBe(opts.default);
    expect(label.innerHTML).toBe(opts.label);
  });

  it("renders with empty settings", () => {
    const rendered = new DOMParser().parseFromString(configurable.render(section, feature, {}), "text/html").body;
    const input = rendered.querySelector("input");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("checkbox");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(input.checked).toBe(opts.default);
    expect(label.innerHTML).toBe(opts.label);
  });

  it("renders with settings", () => {
    const rendered = new DOMParser().parseFromString(configurable.render(section, feature, settings), "text/html").body;
    const input = rendered.querySelector("input");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("checkbox");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(input.checked).toBe(settings[opts.id]);
    expect(label.innerHTML).toBe(opts.label);
  });
});
