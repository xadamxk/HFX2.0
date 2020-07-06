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
    }).toThrow("(id is missing)");
  });

  it("requires id to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.id = null;

    expect(() => {
      new Configurable(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(id is invalid)");
  });

  it("requires type", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.type;

    expect(() => {
      new Configurable(partialOpts); // eslint-disable-line no-new
    }).toThrow("(type is missing)");
  });

  it("requires type to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.type = null;

    expect(() => {
      new Configurable(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(type is invalid)");
  });

  it("requires label", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.label;

    expect(() => {
      new Configurable(partialOpts); // eslint-disable-line no-new
    }).toThrow("(label is missing)");
  });

  it("requires label to be a string", () => {
    const invalidOpts = Object.assign({}, opts);
    invalidOpts.label = null;

    expect(() => {
      new Configurable(invalidOpts); // eslint-disable-line no-new
    }).toThrow("(label is invalid)");
  });

  it("requires default", () => {
    const partialOpts = Object.assign({}, opts);
    delete partialOpts.default;

    expect(() => {
      new Configurable(partialOpts); // eslint-disable-line no-new
    }).toThrow("(default is missing)");
  });

  it("sets properties", () => {
    expect(configurable.id).toBe(opts.id);
    expect(configurable.type).toBe(opts.type);
    expect(configurable.label).toBe(opts.label);
    expect(configurable.default).toBe(opts.default);
  });

  it("requires renderer", () => {
    expect(() => {
      configurable.render();
    }).toThrow(`Rendering has not been implemented for ${configurable.type} configurable.`);
  });
});
