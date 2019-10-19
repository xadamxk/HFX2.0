const HFX = require("../../HFX");

class BatteryAbsoluteTime extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Game,
      name: "Battery Absolute Time",
      default: true,
      description: "Show absolute timestamp for battery full charge.",
      id: "batteryabsolutetime"
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

HFX.Feature.BatteryAbsoluteTime = new BatteryAbsoluteTime();

module.exports = HFX;
