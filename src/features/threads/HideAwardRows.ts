import { Stepper } from "../../configuration/configurables/Stepper";
import { Feature } from "../../core/Feature";
import Threads from "../../sections/Threads";

class HideAwardRows extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Hide Award Rows",
      enabled: false,
      description: "Hide awards that exceed a certain number of rows.",
      // author: {
      //   name: "James",
      //   profile: "https://hackforums.net/member.php?action=profile&uid=2774521",
      // },
      configurables: [
        new Stepper({
          id: "maxRows",
          label: "Rows to display",
          description: "The number of rows to display. 0 to hide all awards.",
          step: 1,
          default: 1,
        }),
      ],
    });
  }

  run(settings: any) {
    const awardsPerRow = 6;
    const awardCount = awardsPerRow * settings.maxRows;
    const awards = this.querySelectorAll(".post_myawards > span");
    if (!awards.length) return;

    var whBump = 0;
    awards.forEach((awardsPostbit) => {
      awardsPostbit.querySelectorAll("i.award_sprite").forEach((award, i) => {
        if (award.classList.contains("award_2")) {
          whBump += 2;
        }

        if (i + whBump >= awardCount) {
          (award as HTMLElement).style.display = "none";
        }
      });
    });
  }
}

export default new HideAwardRows();
