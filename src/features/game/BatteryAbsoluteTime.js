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
    if ($("#game_content_currentpage").length > 0) {
      const extractedRechargeTime = (
        $("#game_content_currentpage").find(".tinytext > span").attr("title")
          ? $("#game_content_currentpage").find(".tinytext > span").attr("title")
          : $("#game_content_currentpage").find("em").text()
      );
      const batteryTimeElement = (
        $("#game_content_currentpage").find(".tinytext > span")
          ? $("#game_content_currentpage").find(".tinytext > span")
          : $(".gmiddle").parent().find("em")
      );
      const rechargeDate = moment(extractedRechargeTime, "MM-DD-YYYY, hh:mm A"); // 06-25-2019, 07:35 PM
      batteryTimeElement.after($("<span>").text("(" + rechargeDate.format("MM-DD-YYYY @ hh:mm A") + ")"));
    }
  }
};

module.exports = new BatteryAbsoluteTime();
