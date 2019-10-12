require("../../_core/HFX");
class MedalOfHonorTracker extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Game,
      name: "Metal of Honor Tracker",
      default: 1,
      description: "Show progress bar toward level 50.",
      id: "medalofhonortracker",
      author: {
        name: "+mK",
        profile: "https://hackforums.net/member.php?action=profile&uid=585389"
      }
    });
  }

  run() {
    if ($("#progress-bar-percentage").length > 0) {
      var goal = 250000;
      // Get current level
      var currentlevel = $("#game_content_currentpage > tr:nth-child(2) > td > div.gtable > div:nth-child(2) > div.gtd.tcenter").text().replace('Level: ', '');

      // Exracts the current XP for the level and removes everything after the space
      var currentlevelXP = $("#game_content_currentpage > tr:nth-child(2) > td > div.game-profile-player.gboxshadow > div:nth-child(2) > div:nth-child(2) > span").text()
        .replace(/\s(.*)/, "").replace(",", "");

      // Total XP
      var totalXP = parseInt(this.determineLevelXP(currentlevel)) + parseInt(currentlevelXP);

      // Tooltip percentage
      var wholePercent = this.getWholePercent(totalXP, goal);

      // Clone existing progress bar (and children) but change the IDs to be unique
      $("#progress-bar").parent().clone().appendTo(".game-profile-player")
        .children().first().attr("id", "myProgressBar")
        .children().first().attr("id", "myProgressBarPercentage");

      // Change style properties of the clone (and child)
      $("#myProgressBar")
        .attr({
          "title": "Medal of Honor Progress: " + wholePercent + "%"
        })
        .css({
          "border-radius": "6px"
        });
      $("#myProgressBarPercentage")
        .attr({
          "title": "Medal of Honor Progress: " + wholePercent + "%"
        })
        .css({
          "width": (Math.round((totalXP / goal) * 100 * 10000) / 10000) + "%",
          "transition": "0.1s",
          "background-color": "#e2ba2f",
          "box-shadow": "inset 0px 0px 3px 1px #ffffff12",
          "border": "1px solid #292929",
          "height": "11px",
          "border-radius": "6px"
        });

      // Update progress text
      $("#myProgressBar").parent().find(".tinytext").text(this.numberWithCommas(totalXP) + " / " + this.numberWithCommas(goal) + " xp");
    }
  }
  determineLevelXP(level) {
    return Math.pow(level, 2) * 100;
  }

  numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  getWholePercent(percentFor, percentOf) {
    return Math.floor(percentFor / percentOf * 100);
  }
};

module.exports = new MedalOfHonorTracker();
