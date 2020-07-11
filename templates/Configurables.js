const fs = require("fs");
const globby = require("globby");
const mustache = require("mustache");

const template = `module.exports = {
  {{ #configurables }}
  {{{ name }}}: require("./configurables/{{{ name }}}"){{ #next }},{{ /next }}
  {{ /configurables }}
};
`;

mustache.parse(template);

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

function generate() {
  fs.writeFileSync("./src/Configurables.js", mustache.render(template, {configurables: configurables}));
}

if (require.main === module) {
  generate();
}

module.exports = generate;
