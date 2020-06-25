global.chrome = require("sinon-chrome");
const Checkbox = require("../../src/configurables/Checkbox");
const Section = require("../../src/core/Section");
const Feature = require("../../src/core/Feature");

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
  configurables: [configurable]
});

describe("Checkbox", () => {
  it("requires id", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.id;

    expect(() => {
      new Checkbox(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Checkbox as 'id' is missing.");
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
    }).toThrow("Not able to load Checkbox as 'label' is missing.");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Checkbox(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Checkbox as 'default' is missing.");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe("checkbox");
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
  });

  it("renders without settings", () => {
    expect(configurable.render(section, feature).replace(/^\s+|\s+$/gm, "")).toBe(`
      <div class="form-check form-check-inline mr-0">
        <input type="checkbox" class="form-check-input" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" ${opts.default ? "checked" : ""}>
        <label class="form-check-label">${opts.label}</label>
      </div>
    `.replace(/^\s+|\s+$/gm, ""));
  });

  it("renders with empty settings", () => {
    expect(configurable.render(section, feature, {}).replace(/^\s+|\s+$/gm, "")).toBe(`
      <div class="form-check form-check-inline mr-0">
        <input type="checkbox" class="form-check-input" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" ${opts.default ? "checked" : ""}>
        <label class="form-check-label">${opts.label}</label>
      </div>
    `.replace(/^\s+|\s+$/gm, ""));
  });

  it("renders with settings", () => {
    expect(configurable.render(section, feature, settings).replace(/^\s+|\s+$/gm, "")).toBe(`
      <div class="form-check form-check-inline mr-0">
        <input type="checkbox" class="form-check-input" data-section="${section.class}" data-feature="${feature.class}" data-setting="${opts.id}" ${settings[opts.id] ? "checked" : ""}>
        <label class="form-check-label">${opts.label}</label>
      </div>
    `.replace(/^\s+|\s+$/gm, ""));
  });
});
