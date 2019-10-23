const fs = require("fs");
const globby = require("globby");
const mustache = require("mustache");

const template = `const HFX = require("../../HFX");

class {{{ name }}} extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.{{{ section }}},
      name: "{{{ nameSpaced }}}",
      default: {{{ enabled }}},
      description: "{{{ description }}}",
      id: "{{{ nameLower }}}"
    });
  }

  run() {
  }
};

HFX.Feature.{{{ name }}} = new {{{ name }}}();

module.exports = HFX;
`;

mustache.parse(template);

const sections = globby.sync("./src/sections/*.js").map(section => section.split("/").pop().split(".js").shift());
const features = globby.sync("./src/features/**/*.js").map(feature => feature.split("/").pop().split(".js").shift());

const questions = [
  {
    question: "Feature name?",
    validation: {
      validator: answer => features.indexOf(answer) === -1 && answer.match(/^[a-zA-Z0-9]+$/),
      failed: answer => console.error("Feature name is not alphanumeric or already exists.")
    }
  },
  {
    question: "Feature section?",
    choices: sections
  },
  {
    question: "Feature description?",
    validation: {
      validator: answer => answer.trim().length !== 0,
      failed: answer => console.error("Description must not be empty.")
    }
  },
  {
    question: "Feature enabled by default?",
    polar: true
  }
];

function generate() {
  const prompt = require("./prompt");

  prompt(questions, answers => {
    const name = answers[0];
    const nameLower = name.toLowerCase();
    const nameSpaced = name.split(/(?=[A-Z])/).join(" ");
    const section = sections[answers[1]];
    const sectionLower = section.toLowerCase();
    const description = answers[2];
    const enabled = answers[3];

    const feature = mustache.render(template, {
      name: name,
      nameLower: nameLower,
      nameSpaced: nameSpaced,
      section: section,
      description: description,
      enabled: enabled
    });

    if (!fs.existsSync(`./src/features/${sectionLower}`)) {
      fs.mkdirSync(`./src/features/${sectionLower}`);
    }

    fs.writeFileSync(`./src/features/${sectionLower}/${name}.js`, feature);
  });
}

if (require.main === module) {
  generate();
}

module.exports = generate;
