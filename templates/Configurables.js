const globby = require("globby");
const mustache = require("mustache");
const writer = require("./CRLFWriter");

const template = `module.exports = {
  {{ #configurables }}
  {{{ name }}}: require("./configurables/{{{ name }}}"){{ #next }},{{ /next }}
  {{ /configurables }}
};
`;

mustache.parse(template);

function generate() {
  const configurables = globby.sync("./src/configurables/*.js").map(configurable => {
    return {
      name: configurable.split("/").pop().split(".js").shift(),
      next: true
    };
  }).sort((f1, f2) => {
    if (f1.name < f2.name) {
      return -1;
    } else if (f1.name > f2.name) {
      return 1;
    } else {
      return 0;
    }
  });
  configurables[configurables.length - 1].next = false;

  writer("./src/Configurables.js", mustache.render(template, {configurables: configurables}));
}

if (require.main === module) {
  generate();
}

module.exports = generate;
