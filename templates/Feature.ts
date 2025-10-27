import { sync } from "globby";
import Mustache from "mustache";
import { writer } from "./CRLFWriter";
import { prompt } from "./prompt";
import { generate as generateSections } from "./Features";

const template = `import { Feature } from "../../core/Feature";
import {{{ section }}} from "../../sections/{{{ section }}}";

class {{{ name }}} extends Feature {
  constructor() {
    super({
      section: {{{ section }}},
      name: "{{{ nameSpaced }}}",
      enabled: {{{ enabled }}},
      description: "{{{ description }}}"
    });
  }

  run() {
  }
}

export default new {{{ name }}}();
`;

Mustache.parse(template);

const sections = sync("./src/sections/*.ts").map((sectionPath) => {
  const filename = sectionPath.split("/").pop() ?? "";
  return filename.replace(/\.ts$/, "");
});
const features = sync("./src/features/**/*.ts").map((featurePath) => {
  const filename = featurePath.split("/").pop() ?? "";
  return filename.replace(/\.ts$/, "");
});

const questions = [
  {
    question: "Feature name?",
    validation: {
      validator: (answer: string) =>
        features.indexOf(answer) === -1 && answer.match(/^[a-zA-Z0-9]+$/),
      failed: (answer: string) =>
        console.error("Feature name is not alphanumeric or already exists."),
    },
  },
  {
    question: "Feature section?",
    choices: sections,
  },
  {
    question: "Feature description?",
    validation: {
      validator: (answer: string) => answer.trim().length !== 0,
      failed: (answer: string) =>
        console.error("Description must not be empty."),
    },
  },
  {
    question: "Feature enabled by default?",
    polar: true,
  },
];

export function generate() {
  prompt(questions, (answers: any) => {
    const name = answers[0];
    const nameSpaced = name.replace(/([a-z])([A-Z])/g, "$1 $2");
    const section = sections[answers[1]]!;
    const sectionLower = section.toLowerCase();
    const description = answers[2];
    const enabled = answers[3];

    const feature = Mustache.render(template, {
      name: name,
      nameSpaced: nameSpaced,
      section: section,
      description: description,
      enabled: enabled,
    });

    writer(`./src/features/${sectionLower}/${name}.ts`, feature);
    generateSections();
  });
}
