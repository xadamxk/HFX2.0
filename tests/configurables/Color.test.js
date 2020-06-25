global.chrome = require("sinon-chrome");
const Color = require("../../src/configurables/Color");
const Section = require("../../src/core/Section");
const Feature = require("../../src/core/Feature");

const opts = {
  id: "id",
  label: "label",
  default: "#ffeecc"
};
const settings = {};
settings[opts.id] = "#001122";

const configurable = new Color(opts);
const section = new Section("/");
const feature = new Feature({
  section: section,
  name: "name",
  default: false,
  description: "description",
  configurables: [configurable]
});

describe("Color", () => {
  it("requires id", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.id;

    expect(() => {
      new Color(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Color as 'id' is missing.");
  });

  it("ignores type", () => {
    const extraOpts = Object.assign({type: "not color"}, opts);
    const extraConfigurable = new Color(extraOpts);
    expect(extraConfigurable.type).toBe("color");
  });

  it("requires label", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.label;

    expect(() => {
      new Color(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Color as 'label' is missing.");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Color(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Color as 'default' is missing.");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe("color");
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
  });

  it("renders without settings", () => {
    expect(configurable.render(section, feature).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="color" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${opts.default}">
    `.replace(/^\s+|\s+$/gm, ""));
  });

  it("renders with empty settings", () => {
    expect(configurable.render(section, feature, {}).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="color" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${opts.default}">
    `.replace(/^\s+|\s+$/gm, ""));
  });

  it("renders with settings", () => {
    expect(configurable.render(section, feature, settings).replace(/^\s+|\s+$/gm, "")).toBe(`
      <label class="mb-0">${opts.label}</label>
      <input type="color" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" value="${settings[configurable.id]}">
    `.replace(/^\s+|\s+$/gm, ""));
  });
});
