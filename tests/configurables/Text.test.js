global.chrome = require("sinon-chrome");
const Text = require("../../src/configurables/Text");
const Section = require("../../src/core/Section");
const Feature = require("../../src/core/Feature");

const opts = {
  id: "id",
  label: "label",
  default: "something"
};
const settings = {};
settings[opts.id] = "else";

const configurable = new Text(opts);
const section = new Section("/");
const feature = new Feature({
  section: section,
  name: "name",
  default: false,
  description: "description",
  configurables: [configurable]
});

describe("Text", () => {
  it("requires id", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.id;

    expect(() => {
      new Text(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Text as 'id' is missing.");
  });

  it("ignores type", () => {
    const extraOpts = Object.assign({type: "not text"}, opts);
    const extraConfigurable = new Text(extraOpts);
    expect(extraConfigurable.type).toBe("text");
  });

  it("requires label", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.label;

    expect(() => {
      new Text(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Text as 'label' is missing.");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Text(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Text as 'default' is missing.");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe("text");
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
  });

  it("renders without settings", () => {
    expect(configurable.render(section, feature).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="text" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${opts.default}">
    `.replace(/^\s+|\s+$/gm, ""));
  });

  it("renders with empty settings", () => {
    expect(configurable.render(section, feature, {}).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="text" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${opts.default}">
    `.replace(/^\s+|\s+$/gm, ""));
  });

  it("renders with settings", () => {
    expect(configurable.render(section, feature, settings).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="text" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${settings[configurable.id]}">
    `.replace(/^\s+|\s+$/gm, ""));
  });
});
