global.chrome = require("sinon-chrome");
const Configurable = require("../../src/core/Configurable");

const opts = {
  id: "id",
  type: "type",
  label: "label",
  default: "default"
};

const configurable = new Configurable(opts);

describe("Configurable", () => {
  it("requires id", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.id;

    expect(() => {
      new Configurable(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Configurable as 'id' is missing.");
  });

  it("requires type", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.type;

    expect(() => {
      new Configurable(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Configurable as 'type' is missing.");
  });

  it("requires label", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.label;

    expect(() => {
      new Configurable(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Configurable as 'label' is missing.");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Configurable(partialOpts); // eslint-disable-line no-new
    }).toThrow("Not able to load Configurable as 'default' is missing.");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe(opts.type);
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
  });

  it("renders", () => {
    expect(configurable.render()).toBe(`Cannot render ${opts.type} configurable.`);
  });
});
