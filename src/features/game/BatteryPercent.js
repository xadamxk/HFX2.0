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
      const batteryElement = $(".game-top-right-icons > a[data-tooltip*='Power:'] > i").clone().remove();
      $(".game-top-right-icons").append($("<div>")
        .append($("<a>").attr({
          "href": "gamecp.php?action=battery",
          "title": $(batteryElement).attr("title"),
          "data-tooltip": $(batteryElement).attr("data-tooltip")
        }))
        .append($("<span>").css({
          "color": batteryElement.css("color"),
          "padding-left": "10px",
          "font-size": "14px",
          "font-weight": "bold"
        }).text(`${batteryPercent}%`))
      );
    }
  }
}

module.exports = new BatteryPercent();
