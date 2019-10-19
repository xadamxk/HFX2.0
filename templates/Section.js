const fs = require("fs");
const globby = require("globby");
const mustache = require("mustache");

const template = `
const HFX = require("../HFX");

class {{{ name }}} extends HFX.Section {
  constructor() {
    super("{{{ nameLower }}}", "{{{ paths }}}");
  }
};

HFX.Section.{{{ name }}} = new {{{ name }}}();

module.exports = HFX;
`;

mustache.parse(template);

const sections = globby.sync("./src/sections/*.js").map(section => section.split("/").pop().split(".js").shift());

const questions = [
  {
    question: "Section name?",
    validation: {
      validator: answer => sections.indexOf(answer) === -1 && answer.match(/^[a-zA-Z0-9]+$/),
      failed: answer => console.error("Section name is not alphanumeric or already exists.")
    }
  },
  {
    question: "Section paths (comma-separated)?",
    parser: answer => answer.split(",").join("\", \""),
    validation: {
      validator: answer => answer.length !== 0,
      failed: answer => console.error("Must provide at least one path.")
    }
  }
];

function generate() {
  const prompt = require("./prompt");

  prompt(questions, answers => {
    const section = mustache.render(template, {
      name: answers[0],
      nameLower: answers[0].toLowerCase(),
      paths: answers[1]
    });

    fs.writeFileSync(`./src/sections/${answers[0]}.js`, section);
  });
}

if (require.main === module) {
  generate();
}

module.exports = generate;
