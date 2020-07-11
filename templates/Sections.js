const globby = require("globby");
const mustache = require("mustache");
const writer = require("./CRLFWriter");

const template = `module.exports = {
  {{ #sections }}
  {{{ name }}}: require("./sections/{{{ name }}}"){{ #next }},{{ /next }}
  {{ /sections }}
};
`;

mustache.parse(template);

function generate() {
  const sections = globby.sync("./src/sections/*.js").map(section => {
    return {
      name: section.split("/").pop().split(".js").shift(),
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
  sections[sections.length - 1].next = false;

  writer("./src/Sections.js", mustache.render(template, {sections: sections}));
}

if (require.main === module) {
  generate();
}

module.exports = generate;
