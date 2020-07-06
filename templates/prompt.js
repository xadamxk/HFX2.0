module.exports = (questions, cb) => {
  const readline = require("readline");
  const rl = readline.createInterface(process.stdin, process.stdout);

  let currentQuestion = 0;
  let finished = false;
  let ignore = false;
  const answers = [];

  const askQuestion = question => {
    let options = "";

    if ("choices" in question) {
      ignore = true;

      for (let i = 0; i < question.choices.length; i++) {
        rl.write(`[${i}] ${question.choices[i]}\n`);
      }

      ignore = false;
      options = `[0-${question.choices.length - 1}] `;
    } else if ("polar" in question) {
      options = "[Y/N] ";
    }

    rl.setPrompt(`${question.question} ${options}`);
    rl.prompt();
  };

  askQuestion(questions[currentQuestion]);

  rl.on("line", line => {
    if (ignore) {
      return;
    }

    let answer;

    if ("choices" in questions[currentQuestion]) {
      answer = parseInt(line);
      answer = isNaN(answer) ? -1 : answer;

      if (answer < 0 || answer >= questions[currentQuestion].choices.length) {
        askQuestion(questions[currentQuestion]);
        return;
      }
    } else if ("polar" in questions[currentQuestion]) {
      answer = line.trim().toLowerCase();

      let positive = /^(?:y)|(?:yes)|(?:yeah)|(?:yep)$/;
      let negative = /^(?:n)|(?:no)|(?:nope)|(?:nop)$/;

      if (typeof questions[currentQuestion].polar === "object") {
        if ("positive" in questions[currentQuestion].polar) {
          positive = questions[currentQuestion].polar.positive;
        }

        if ("negative" in questions[currentQuestion].polar) {
          negative = questions[currentQuestion].polar.negative;
        }
      }

      if (answer.match(positive)) {
        answer = true;
      } else if (answer.match(negative)) {
        answer = false;
      } else {
        askQuestion(questions[currentQuestion]);
        return;
      }
    } else if ("parser" in questions[currentQuestion]) {
      answer = questions[currentQuestion].parser(line);
    } else {
      answer = line;
    }

    if ("validation" in questions[currentQuestion]) {
      if (!questions[currentQuestion].validation.validator(answer)) {
        if ("failed" in questions[currentQuestion].validation) {
          questions[currentQuestion].validation.failed(answer);
        }

        askQuestion(questions[currentQuestion]);
        return;
      }
    }

    answers.push(answer);

    if (++currentQuestion < questions.length) {
      askQuestion(questions[currentQuestion]);
    } else {
      finished = true;
      rl.close();
    }
  });

  rl.on("close", () => {
    if (finished) {
      if (cb !== undefined && typeof cb === "function") {
        cb(answers);
      }
    } else {
      console.error("\nPrompt exited. No action taken.");
    }
  });
};
