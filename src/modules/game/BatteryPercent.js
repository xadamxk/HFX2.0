require("../../_core/HFX");
class BatteryPercent extends HFX.Feature {
  constructor() {
    super({
      section: "game",
      name: "Battery Percent",
      default: 1,
      description: "Show percentage next to battery icon.",
      id: "batterypercent"
    });
  }

  run() {
    var batteryPercent = (
      $(".game-top-right-icons > a:eq(4)")
        ? parseInt($(".game-top-right-icons > a:eq(4)").attr("title").replace("%", ""))
        : 0);
    var batteryElement = $("[class^='hficon-battery-']").filter((index, item) => { return $(item).attr('href') });
    batteryElement.after($("<span>").css({ "margin-left": "10px", "color": batteryElement.css('color') }).text(batteryPercent + "%"));
  }
};

module.exports = new BatteryPercent();
