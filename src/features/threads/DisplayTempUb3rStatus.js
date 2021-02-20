const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class DisplayTempUb3rStatus extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Display Temp Ub3r Status",
      default: true,
      description: "Displays the temp Ub3r status in the postbit for users who do not have permanent Ub3r.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      }
    });
  }

  run() {
    document.querySelectorAll("div.post_myawards > span > i[title*='Ub3r until']").forEach((award) => {
      let uberStatus = document.createElement("span");
      uberStatus.textContent = award.title;
      award.parentElement.parentElement.parentElement.append(uberStatus);
    });
  }
};

module.exports = new DisplayTempUb3rStatus();
