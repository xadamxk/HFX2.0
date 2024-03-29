const Feature = require("../../core/Feature");
const Game = require("../../sections/Game");

class MedalOfHonorTracker extends Feature {
  constructor() {
    super({
      section: Game,
      name: "Medal of Honor Tracker",
      default: true,
      description: "Show progress bar toward level 50.",
      author: {
        name: "+mK",
        profile: "https://hackforums.net/member.php?action=profile&uid=585389"
      }
    });
    this.numberFormatter = new Intl.NumberFormat("en-US");
  }

  run() {
    if ($("#progress-bar-percentage").length > 0) {
      const goal = 250000;
      // Get current level
      const currentlevel = $("#game_content_currentpage > tr:nth-child(2) > td > div.gtable > div:nth-child(2) > div.gtd.tcenter").text().replace("Level: ", "");

      // Extracts the current XP for the level and removes everything after the space
      const currentlevelXP = $("#game_content_currentpage > tr:nth-child(2) > td > div.game-profile-player.gboxshadow > div:nth-child(2) > div:nth-child(2) > span").text()
        .replace(/\s(.*)/, "").replace(",", "");

      // Total XP
      const totalXP = parseInt(this.determineLevelXP(currentlevel)) + parseInt(currentlevelXP);

      // Tooltip percentage
      var wholePercent = this.getWholePercent(totalXP, goal);
      if (wholePercent >= 100) {
        wholePercent = 100;
      }

      // Clone existing progress bar (and children) but change the IDs to be unique
      $("#progress-bar").parent().clone().appendTo(".game-profile-player")
        .children().first().attr("id", "HFXProgressBar")
        .children().first().attr("id", "HFXProgressBarPercentage");

      // Change style properties of the clone (and child)
      $("#HFXProgressBar")
        .attr({
          "title": "Medal of Honor Progress: " + wholePercent + "%"
        })
        .css({
          "border-radius": "6px"
        });
      $("#HFXProgressBarPercentage")
        .attr({
          "title": "Medal of Honor Progress: " + wholePercent + "%"
        })
        .css({
          "width": wholePercent + "%",
          "transition": "0.1s",
          "background-color": "#e2ba2f",
          "box-shadow": "inset 0px 0px 3px 1px #ffffff12",
          "border": "1px solid #292929",
          "height": "11px",
          "border-radius": "6px"
        });

      // Update progress text
      $("#HFXProgressBar").parent().find(".tinytext").text(this.numberWithCommas(totalXP) + " / " + this.numberWithCommas(goal) + " xp");
    }
  }

  determineLevelXP(level) {
    return Math.pow(level, 2) * 100;
  }

  numberWithCommas(x) {
    return this.numberFormatter.format(x);
  }

  getWholePercent(percentFor, percentOf) {
    return Math.floor(percentFor / percentOf * 100);
  }
}

module.exports = new MedalOfHonorTracker();
