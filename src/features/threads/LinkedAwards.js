const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class LinkedAwards extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Linked Awards",
      default: true,
      description: "Make awards that are coupled to a specific thread/post linkable.",
      author: {
        name: "False King",
        profile: "https://hackforums.net/member.php?action=profile&uid=1665634"
      }
    });
  }

  run() {
    document.querySelectorAll("div.post_myawards > span").forEach((awardsPostbit) => {
      awardsPostbit.querySelectorAll("i.award_sprite").forEach((award, i) => {
        const urlRegex = new RegExp(/\b(http|https)?:\/\/\S+/i);
        const awardClassIds = [
          "award_137", // Emerald Egg
          "award_138", // Sapphire Egg
          "award_139", // Gold Egg
          "award_143", // Ruby Egg
          "award_85", // Green Clover
          "award_86", // Purple Clover
          "award_87" // Gold Clover
        ];

        let result;

        if (urlRegex.test(award.title)) {
          const matches = award.title.match(urlRegex);
          result = matches[0];
        } else if (awardClassIds.includes(award.classList.item(1))) {
          const threadId = award.title.match(/\d+/g);
          result = "https://hackforums.net/showthread.php?tid=" + threadId;
        }

        if (result) {
          award.classList.add("hfx-linkable");
          award.style.cursor = "pointer";
          award.dataset.hfxLinkable = result;
        }
      });
    });

    const linkedAwards = document.getElementsByClassName("hfx-linkable");

    for (var i = 0; i < linkedAwards.length; i++) {
      linkedAwards[i].addEventListener("click", (el) => {
        window.location = el.target.dataset.hfxLinkable;
      });
    }
  }
};

module.exports = new LinkedAwards();
