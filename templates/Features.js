const globby = require("globby");
const mustache = require("mustache");
const writer = require("./CRLFWriter");

const template = `module.exports = {
  {{ #features }}
  {{{ name }}}: require("./features/{{{ section }}}/{{{ name }}}"){{ #next }},{{ /next }}
  {{ /features }}
};
`;

mustache.parse(template);

function generate() {
  const features = globby.sync("./src/features/**/*.js").map(feature => {
    feature = feature.split("/")
    const name = feature.pop().split(".js").shift();
    const section = feature.pop();
  
    return {
      name: name,
      section: section,
      next: true
    };
  }).sort((f1, f2) => {
    if (f1.name < f2.name) {
      return -1;
    } else if (f1.name > f2.name) {
      return 1;
    } else if (f1.section < f2.section) {
      return -1;
    } else if (f1.section > f2.section) {
      return 1;
    } else {
      return 0;
    }
  });
  features[features.length - 1].next = false;

  writer("./src/Features.js", mustache.render(template, {features: features}));
}

if (require.main === module) {
  generate();
}

module.exports = generate;
