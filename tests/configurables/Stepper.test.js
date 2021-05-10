global.chrome = require("sinon-chrome");
const Stepper = require("../../src/configurables/Stepper");
const Section = require("../../src/core/Section");
const Feature = require("../../src/core/Feature");
const ConfigurableArray = require("../../src/core/ConfigurableArray");

const opts = {
  id: "id",
  label: "label",
  default: false,
  step: 2
};
const settings = {};
settings[opts.id] = !opts.default;

const configurable = new Stepper(opts);
const section = new Section("/");
const feature = new Feature({
  section: section,
  name: "name",
  default: false,
  step: 2,
  description: "description",
  configurables: new ConfigurableArray(configurable)
});

describe("Stepper", () => {
  it("requires id", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.id;

    expect(() => {
      new Stepper(partialOpts); // eslint-disable-line no-new
    }).toThrow("(id is missing)");
  });

  it("requires id to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.id = null;

    expect(() => {
      new Stepper(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(id is invalid)");
  });

  it("ignores type", () => {
    const extraOpts = Object.assign({type: "not number"}, opts);
    const extraConfigurable = new Stepper(extraOpts);
    expect(extraConfigurable.type).toBe("number");
  });

  it("requires label", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.label;

    expect(() => {
      new Stepper(partialOpts); // eslint-disable-line no-new
    }).toThrow("(label is missing)");
  });

  it("requires label to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.label = null;

    expect(() => {
      new Stepper(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(label is invalid)");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Stepper(partialOpts); // eslint-disable-line no-new
    }).toThrow("(default is missing)");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe("number");
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
    expect(configurable.step).toBe(opts.step);
  });

  it("renders without settings", () => {
    const rendered = new DOMParser().parseFromString(configurable.render(section, feature), "text/html").body;
    const input = rendered.querySelector("input");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("number");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(input.step).toBe(opts.step.toString());
    expect(label.innerHTML).toBe(opts.label);
  });

  it("renders with empty settings", () => {
    const rendered = new DOMParser().parseFromString(configurable.render(section, feature, {}), "text/html").body;
    const input = rendered.querySelector("input");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("number");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(input.step).toBe(opts.step.toString());
    expect(label.innerHTML).toBe(opts.label);
  });

  it("renders with settings", () => {
    const rendered = new DOMParser().parseFromString(configurable.render(section, feature, settings), "text/html").body;
    const input = rendered.querySelector("input");
    const label = rendered.querySelector("label");

    expect(input.type).toBe("number");
    expect(input.dataset).toMatchObject({
      section: section.class,
      feature: feature.class,
      setting: opts.id
    });
    expect(settings[opts.id]).toBe(true);
    expect(label.innerHTML).toBe(opts.label);
  });
});
