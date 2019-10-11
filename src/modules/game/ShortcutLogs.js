require("../../_core/HFX");
class ShortcutLogs extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Game,
      name: "Shortcut: Logs",
      default: 1,
      description: "Show logs shortcut in game header",
      id: "shortcutlogs"
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
              function () {
                $(this).css({ "color": "#4d2f5d" });
              }, function () {
                $(this).css({ "color": "#ababab" });
              })));
    }
  }
};

module.exports = new ShortcutLogs();
