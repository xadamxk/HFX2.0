const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Stepper = require("../../configurables/Stepper");
const Util = require("../../core/Util");

class HideAwardRows extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Hide Award Rows",
      default: false,
      description: "Hide awards that exceed a certain number of rows.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      },
      configurables: new ConfigurableArray(
        new Stepper({id: "hideAwardRowsNumber", label: "Rows to display", step: 1, default: 1})
      )
    });
  }

  run(settings) {
    var awardCount = parseInt(Util.getConfigurableValue("hideAwardRowsNumber", this, settings)) * 6;

    document.querySelectorAll("div.post_myawards > span").forEach((awardsPostbit) => {
      awardsPostbit.querySelectorAll("i.award_sprite").forEach((award, i) => {
        if (i >= awardCount) {
          award.remove();
        }
      });
    });
  }
};

module.exports = new HideAwardRows();
