const HFX = require("../HFX");

class Game extends HFX.Section {
  constructor() {
    super("game", "/gamecp.php");
  }
};

HFX.Section.Game = new Game();

module.exports = HFX;
