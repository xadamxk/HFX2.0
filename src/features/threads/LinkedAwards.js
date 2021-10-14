const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class LinkedAwards extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Linked Awards",
      default: true,
      description: "Makes awards clickable if the description contains a link.",
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

        if (urlRegex.test(award.title)) {
          const matches = award.title.match(urlRegex);

          award.classList.add("hfx-linkable");
          award.style.cursor = "pointer";
          award.dataset.hfxLinkable = matches[0];
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
