import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { SectionArray } from "../../core/SectionArray";
import Awards from "../../sections/Awards";

class AwardGoalAdditions extends Feature {
  constructor() {
    super({
      section: Awards,
      name: "Award Goal Additions",
      enabled: true,
      description: "Adds additional information to award goal cards.",
      additionalSections: new SectionArray(new Section(["/awardgoals.php"]))
    });
  }

  run() {
    const url = location.href;
    if (!url.includes("/awardgoals.php")) return;
    const header = Array.from(document.querySelectorAll("td.thead > strong"))
      .find(el => (el.textContent || "").trim() === "Award Goals");
    if (!header) return;

    const table = header.closest("table");
    if (!table) return;

    const awardGoalContainer = table.querySelector("td.trow1.tcenter > div") as HTMLElement | null;
    if (!awardGoalContainer) return;

    const awardGoalCards = Array.from(awardGoalContainer.children) as HTMLElement[];

    awardGoalCards.forEach((card) => {
      const iconEl = card.querySelector("i.award_sprite");
      const linkEl = card.querySelector("a");
      const awardGoalName = ((iconEl?.getAttribute("title") || linkEl?.textContent) || "").trim();

      const percentageTextEl = card.querySelector("text.percentage") || card.querySelector(".percentage");
      const awardGoalProgressText = ((percentageTextEl?.textContent) || "").replace("%", "");

      switch (awardGoalName) {
        case "24k Star": {
          const remainingPosts = this.calculateGoal(24000, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining Posts: ~${remainingPosts}`);
          break;
        }
        case "Bronze Tutorial": {
          const remainingTutorials = this.calculateGoal(10, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining Tutorials: ${remainingTutorials}`);
          break;
        }
        case "Business Man": {
          const remainingBooyahRatings = this.calculateGoal(100, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining Booyahs: ${remainingBooyahRatings}`);
          break;
        }
        // case "Hackúman Killer": {
        //   const remainingHackuman = this.calculateGoal(50, awardGoalProgressText);
        //   this.appendDescriptionToCard(card, `Remaining Kills: ${remainingHackuman}`);
        //   break;
        // }
        case "Flip Reaper": {
          const remainingFlips = this.calculateGoal(10, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining Flips: ${remainingFlips}`);
          break;
        }
        case "Green Apple": {
          const remainingGreenApple = this.calculateGoal(1000, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining Popularity: ${remainingGreenApple}`);
          break;
        }
        case "Lounge Head": {
          const remainingLoungeHead = this.calculateGoal(500, awardGoalProgressText);
          this.appendDescriptionToCard(card, `~${remainingLoungeHead} lounge posts from today`);
          break;
        }
        // case "Golden Content": {
        //   const remainingGoldenContent = this.calculateGoal(5, awardGoalProgressText);
        //   this.appendDescriptionToCard(card, `Remaining Blogs: ${remainingGoldenContent}`);
        //   break;
        // }
        case "Medal of Honor": {
          const remainingLevels = this.calculateGoal(50, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining Levels: ${remainingLevels}`);
          break;
        }
        // General Octoberfest logic is handled in the default case
        case "Quickly Loved": {
          const remainingQLs = this.calculateGoal(100, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining Quick Loves: ${remainingQLs}`);
          break;
        }
        case "SportsBook": {
          const remainingSportbooks = this.calculateGoal(100000, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining Byte Bets: ${remainingSportbooks}`);
          break;
        }
        case "Stanley Fan": {
          const remainingStanleyFans = this.calculateGoal(250, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining threads: ${remainingStanleyFans}`);
          break;
        }
        case "King Decade": {
          const remainingKingDecade = this.calculateGoal(10, awardGoalProgressText);
          this.appendDescriptionToCard(card, `Remaining years: ${remainingKingDecade}`);
          break;
        }
        default: {
          if(awardGoalName.includes("Octoberfest")){
            const remainingOctoberfest = this.calculateGoal(500, awardGoalProgressText);
            this.appendDescriptionToCard(card, `Remaining Posts: ${remainingOctoberfest}`);
            break;
          }
        }
      }
    });
  }

  private appendDescriptionToCard(card: Element, description: string): void {
    const descriptionDiv = document.createElement("div");
    descriptionDiv.textContent = description;

    const svgAnchor = card.querySelector("svg.circular-chart");
    if (svgAnchor && svgAnchor.parentElement) {
      svgAnchor.parentElement.insertBefore(descriptionDiv, svgAnchor);
      return;
    }

    const targets = card.querySelectorAll("div > div");
    const fallbackAnchor = targets[2];
    if (fallbackAnchor && fallbackAnchor.parentElement) {
      fallbackAnchor.parentElement.insertBefore(descriptionDiv, fallbackAnchor.nextSibling);
    }
  }

  private calculateGoal(goal: number, progress: string | number): number {
    const progressNumber = typeof progress === "number" ? progress : parseFloat(progress) || 0;
    const remaining = Math.floor(goal - Math.ceil(goal * (progressNumber / 100)));
    return remaining < 0 ? 0 : remaining;
  }
}

export default new AwardGoalAdditions();
