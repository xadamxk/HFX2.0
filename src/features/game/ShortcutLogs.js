const Feature = require("../../core/Feature");
const Game = require("../../sections/Game");

class ShortcutLogs extends Feature {
  constructor() {
    super({
      section: Game,
      name: "Shortcut: Logs",
      default: true,
      description: "Show logs shortcut in game header."
    });
  }

  run() {
    if ($(".game-top-right-icons").length > 0) {
      $(".game-top-right-icons")
        .prepend($("<a>").attr("href", "gamecp.php?action=logs")
          .append($("<i>").addClass("hficon-drawer-paper2")
            .attr({ "title": "Logs" })
            .css({
              "margin-left": "12px",
              "font-size": "24px",
              "color": "#ababab"
            }).hover(
              function() {
                $(this).css({ "color": "#4d2f5d" });
              }, function() {
                $(this).css({ "color": "#ababab" });
              })));
    }
  }
}

module.exports = new ShortcutLogs();
