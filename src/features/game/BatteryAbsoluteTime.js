const Feature = require("../../core/Feature");
const Game = require("../../sections/Game");

class BatteryAbsoluteTime extends Feature {
  constructor() {
    super({
      section: Game,
      name: "Battery Absolute Time",
      default: true,
      description: "Show absolute timestamp for battery full charge."
    });
  }

  run() {
    const gameContentElement = $("#game_content_currentpage");
    const rechargeTimeElement = $(gameContentElement).find(".smart-time");
    if ($(gameContentElement).length > 0 && rechargeTimeElement.length > 0) {
      const extractedRechargeTime = $(rechargeTimeElement).attr("title");
      rechargeTimeElement.after($("<span>").text(`(${extractedRechargeTime})`));
    }
  }
}

module.exports = new BatteryAbsoluteTime();
