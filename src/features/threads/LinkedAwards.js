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
        const urlRegex = new RegExp(/\bhttps?:\/\/\S+/i);
        const eggAwards = [
          "award_137", // Emerald
          "award_138", // Sapphire
          "award_139", // Gold
          "award_143" // Ruby
        ];

        let result = "";

        if (urlRegex.test(award.title)) {
          const matches = award.title.match(urlRegex);
          result = matches[0];
        } else if (eggAwards.includes(award.classList.item(1))) {
          const postId = award.title.match(/\d+/g);
          result = "https://hackforums.net/showthread.php?tid=" + postId;
        }

        if (result.length > 0) {
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
