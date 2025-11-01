import { prompt } from "./prompt";
import { generate as generateSection } from "./Section";
import { generate as generateFeatures } from "./Section";
import { generate as generateSections } from "./Sections";
import { generate as generateFeature } from "./Feature";

const templates: { [key: string]: any } = {
  feature: generateFeature,
  features: generateFeatures,
  section: generateSection,
  sections: generateSections,
};

function capitalize(word: string) {
  const wordParts = word.toLowerCase().split("");
  wordParts[0] = wordParts[0].toUpperCase();
  return wordParts.join("");
}

function chooseTemplate() {
  const keys = Object.keys(templates);
  const questions = [
    {
      question: "Choose a template.",
      choices: keys.map((key) => capitalize(key)),
    },
  ];

  prompt(questions, (answers: any) => {
    templates[keys[answers[0]]]();
  });
}

const args = process.argv;

if (args.length === 3) {
  const arg = args[2].toLowerCase();

  if (arg in templates) {
    templates[arg]();
  } else {
    chooseTemplate();
  }
} else {
  chooseTemplate();
}
