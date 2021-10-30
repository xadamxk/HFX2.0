const Configurable = require("../core/Configurable");

module.exports = class LineBreak extends Configurable {
  constructor(opts) {
    console.log(opts);
    super(Object.assign(opts, {
      id: "myLineBreak",
      label: "",
      type: "lineBreak",
      default: true
    }));
  }
  render() {
    return `
    <hr/>
    `;
  }
};
