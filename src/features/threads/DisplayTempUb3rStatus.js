const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class DisplayTempUb3rStatus extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Display Temp Ub3r Status",
      default: false,
      description: "Displays the Ub3r expiration date below the awards for users who do not have permanent Ub3r.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      }
    });
  }

  run() {
    document.querySelectorAll("div.post_myawards > span > i[title*='Ub3r until']").forEach((award, index) => {
      let uberStatus = document.createElement("span");
      uberStatus.textContent = award.title;
      uberStatus.id = "HFXDisplayTempUb3rStatus";
      uberStatus.style.fontSize = "13px";
      uberStatus.style.display = "inline-block";
      award.parentElement.parentElement.parentElement.append(uberStatus);
    });
  }
};

module.exports = new DisplayTempUb3rStatus();
