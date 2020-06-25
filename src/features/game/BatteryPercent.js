const Feature = require("../../core/Feature");
const Game = require("../../sections/Game");

class BatteryPercent extends Feature {
  constructor() {
    super({
      section: Game,
      name: "Battery Percent",
      default: true,
      description: "Show percentage next to battery icon."
    });
  }

  run() {
    if ($("#game_content_currentpage").length > 0) {
      const batteryPercent = (
        $(".game-top-right-icons > a:eq(4)")
          ? parseInt($(".game-top-right-icons > a:eq(4)").attr("title").replace("%", ""))
          : 0);
      const batteryElement = $("[class^='hficon-battery-']").filter((index, item) => { return $(item).attr("href"); });
      batteryElement.after($("<span>").css({ "margin-left": "10px", "color": batteryElement.css("color") }).text(batteryPercent + "%"));
    }
  }
};

module.exports = new BatteryPercent();
