global.chrome = require("sinon-chrome");
const Generic = require("../../src/configurables/Generic");
const Section = require("../../src/core/Section");
const Feature = require("../../src/core/Feature");

const opts = {
  id: "id",
  type: "type",
  label: "label",
  default: "default"
};
const settings = {};
settings[opts.id] = "not default";

const configurable = new Generic(opts);
const section = new Section("/");
const feature = new Feature({
  section: section,
  name: "name",
  default: false,
  description: "description",
  configurables: [configurable]
});

describe("Generic", () => {
  it("requires id", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.id;

    expect(() => {
      new Generic(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Generic as 'id' is missing.");
  });

  it("requires type", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.type;

    expect(() => {
      new Generic(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Generic as 'type' is missing.");
  });

  it("requires label", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.label;

    expect(() => {
      new Generic(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Generic as 'label' is missing.");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Generic(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Generic as 'default' is missing.");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe(opts.type);
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
  });

  it("renders without settings", () => {
    expect(configurable.render(section, feature).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="${opts.type}" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${opts.default}">
    `.replace(/^\s+|\s+$/gm, ""));
  });

  it("renders with empty settings", () => {
    expect(configurable.render(section, feature, {}).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="${opts.type}" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${opts.default}">
    `.replace(/^\s+|\s+$/gm, ""));
  });

  it("renders with settings", () => {
    expect(configurable.render(section, feature, settings).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="${opts.type}" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${settings[configurable.id]}">
    `.replace(/^\s+|\s+$/gm, ""));
  });
});
