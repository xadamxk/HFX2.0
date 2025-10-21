import { sync } from "globby";
import Mustache from "mustache";
import { writer } from "./CRLFWriter";
import { prompt } from "./prompt";
import { generate as generateSections } from "./Sections";

const template = `import { Section } from "../core/Section";
// TODO: Allow this.name to have spaces (but trim them from other name uses)

class {{{ name }}} extends Section {
  constructor() {
    super(["{{{ paths }}}"], ["{{{ elementSelectors }}}"]);
    this.class = "{{{ name }}}";
    this.name = "{{{ name }}}";
  }
};

export default new {{{ name }}}();

`;

Mustache.parse(template);

const sections = sync("./src/sections/*.ts").map((sectionPath) => {
  const filename = sectionPath.split("/").pop() ?? "";
  return filename.replace(/\.ts$/, "");
});

const questions = [
  {
    question: "Section name?",
    validation: {
      validator: (answer: string) =>
        sections.indexOf(answer) === -1 && answer.match(/^[a-zA-Z0-9]+$/),
      failed: (answer: string) =>
        console.error("Section name is not alphanumeric or already exists."),
    },
  },
  {
    question:
      "Section paths [ex. '/settings'] (required, comma-separated, allows regex)?",
    parser: (answer: string) => answer.split(",").join('", "'),
    validation: {
      validator: (answer: string) => answer.length !== 0,
      failed: (answer: string) =>
        console.error("Must provide at least one path."),
    },
  },
  {
    question:
      "Section element selectors [ex. '#element-id'] (optional, comma-separated)?",
    parser: (answer: string) => answer && answer.split(",").join('", "'),
    // validation: {
    //   validator: (answer: string) => answer.length !== 0,
    //   failed: (answer: string) =>
    //     console.error("Must provide at least one path."),
    // },
  },
];

export function generate() {
  prompt(questions, (answers: string[]) => {
    const name = answers[0];
    const paths = answers[1];
    const elementSelectors = answers[2];

    const section = Mustache.render(template, {
      name: name,
      paths: paths,
      elementSelectors: elementSelectors,
    });

    writer(`./src/sections/${name}.ts`, section);
    generateSections();
  });
}
