const templates = {
  section: require("./Section"),
  feature: require("./Feature"),
  sections: require("./Sections"),
  features: require("./Features"),
  configurables: require("./Configurables")
};

function capitalize(word) {
  word = word.toLowerCase().split("");
  word[0] = word[0].toUpperCase();
  return word.join("");
}

function chooseTemplate() {
  const prompt = require("./prompt");
  const keys = Object.keys(templates);
  const questions = [
    {
      question: "Choose a template.",
      choices: keys.map(key => capitalize(key))
    }
  ];

  prompt(questions, answers => {
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
