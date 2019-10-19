const fs = require("fs");
const globby = require("globby");
const mustache = require("mustache");

const template = `
const HFX = require("../../HFX");

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
    const feature = mustache.render(template, {
      name: answers[0],
      nameLower: answers[0].toLowerCase(),
      nameSpaced: answers[0].split(/(?=[A-Z])/).join(" "),
      section: sections[answers[1]],
      description: answers[2],
      enabled: answers[3]
    });

    fs.writeFileSync(`./src/features/${sections[answers[1]]}/${answers[0]}.js`, feature);
  });
}

if (require.main === module) {
  generate();
}

module.exports = generate;
