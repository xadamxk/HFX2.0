const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");
const Awards = require("../../sections/Awards");

const awardGoalsSection = new Section("/awardgoals.php");

class AwardGoalAdditions extends Feature {
  constructor() {
    super({
      section: Awards,
      name: "Award Goal Additions",
      default: true,
      description: "Adds additional information to award goal cards.",
      additionalSections: new SectionArray(awardGoalsSection)
    });
  }

  run() {
    const awardGoalTableRow = $("strong:contains('Award Goals')").parent().parent().next();
    const awardGoalContainer = $(awardGoalTableRow).find("td > div");
    const awardGoalCards = awardGoalContainer.children();

    awardGoalCards.toArray().forEach((card) => {
      const awardGoalName = $(card).find("div > div:eq(1)").text().trim() || "";
      const awardGoalProgress = $(card).find(".percentage").text().replace("%", "") || "";

      switch (awardGoalName) {
        case "24k Star":
          const remainingPosts = this.calculateGoal(24000, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Posts: ~${remainingPosts}`);
          break;
        case "Business Man":
          const remainingBooyahRatings = this.calculateGoal(100, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Booyahs: ${remainingBooyahRatings}`);
          break;
        case "Hackúman Killer":
          const remainingHackuman = this.calculateGoal(50, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Kills: ${remainingHackuman}`);
          break;
        case "Lounge Head":
          const remainingLoungeHead = this.calculateGoal(500, awardGoalProgress);
          this.appendDescriptionToCard(card, `~${remainingLoungeHead} lounge posts from today`);
          break;
        case "Bronze Tutorial":
          const remainingTutorials = this.calculateGoal(10, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Tutorials: ${remainingTutorials}`);
          break;
        case "Golden Content":
          const remainingGoldenContent = this.calculateGoal(5, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Blogs: ${remainingGoldenContent}`);
          break;
        case "Green Apple":
          const remainingGreenApple = this.calculateGoal(1000, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Popularity: ${remainingGreenApple}`);
          break;
        case "Medal of Honor":
          const remainingLevels = this.calculateGoal(50, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Levels: ${remainingLevels}`);
          break;
        case "Quickly Loved":
          const remainingQLs = this.calculateGoal(100, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Quick Loves: ${remainingQLs}`);
          break;
        case "SportsBook":
          const remainingSportbooks = this.calculateGoal(100000, awardGoalProgress);
          this.appendDescriptionToCard(card, `Remaining Byte Bets: ${remainingSportbooks}`);
          break;
        default: console.log();
      }
    });
  }

  appendDescriptionToCard(card, description) {
    $(card).find("div > div:eq(2)").after($("<div>").text(description));
  }

  calculateGoal(goal, progress) {
    return Math.floor(goal - Math.ceil(goal * (progress / 100)));
  }
};

module.exports = new AwardGoalAdditions();
