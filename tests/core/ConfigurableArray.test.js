global.chrome = require("sinon-chrome");
const ConfigurableArray = require("../../src/core/ConfigurableArray");
const Configurable = require("../../src/core/Configurable");

const configurableArray = new ConfigurableArray(
  new Configurable({
    id: "id1",
    type: "type1",
    label: "label1",
    default: "default1"
  }),
  new Configurable({
    id: "id2",
    type: "type2",
    label: "label2",
    default: "default2"
  })
);

describe("ConfigurableArray", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("requires every item to be a Configurable", () => {
    expect(() => {
      new ConfigurableArray("not a configurable"); // eslint-disable-line no-new
    }).toThrow("Every item of a ConfigurableArray must be an instance of a Configurable.");
  });

  it("renders every Configurable item", () => {
    for (const configurable of configurableArray.configurables) {
      jest.spyOn(configurable, "render").mockReturnValue(`|${configurable.id} ${configurable.type} ${configurable.label} ${configurable.default}|`);
    }

    const rendered = configurableArray.render();

    for (const configurable of configurableArray.configurables) {
      expect(rendered).toEqual(expect.stringContaining(`|${configurable.id} ${configurable.type} ${configurable.label} ${configurable.default}|`));
    }
  });

  it("gets correct Configurable by ID", () => {
    for (const configurable of configurableArray.configurables) {
      expect(configurableArray.get(configurable.id)).toStrictEqual(configurable);
    }
  });
});
