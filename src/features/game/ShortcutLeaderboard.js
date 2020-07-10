const Feature = require("../../core/Feature");
const Game = require("../../sections/Game");

class ShortcutLeaderboard extends Feature {
  constructor() {
    super({
      section: Game,
      name: "Shortcut: Leaderboard",
      default: true,
      description: "Show leaderboard shortcut in game header."
    });
  }

  run() {
    if ($(".game-top-right-icons").length > 0) {
      $(".game-top-right-icons")
        .prepend($("<a>").attr("href", "gamecp.php?action=leaderboard&type=1")
          .append($("<i>").addClass("hficon-medal-empty")
            .attr({ "title": "Leaderboard" })
            .css({
              "margin-left": "12px",
              "font-size": "24px",
              "color": "#ababab"
            }).hover(
              function () {
                $(this).css({ "color": "#4d2f5d" });
              }, function () {
                $(this).css({ "color": "#ababab" });
              })
          )
        );
    }
  }
};

module.exports = new ShortcutLeaderboard();
