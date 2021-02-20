const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");
const ForumDisplay = require("../../sections/ForumDisplay");

const searchSection = new Section("/search.php");

class AntiCapsLockTitles extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Anti Caps Lock Titles",
      default: false,
      description: "Automatically change thread titles written in caps lock to title case.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      },
      additionalSections: new SectionArray(searchSection)
    });
  }

  run() {
    document.querySelectorAll("tr.inline_row").forEach((row) => {
      try {
        if (window.location.href.includes("search.php")) {
          let threadName = row.querySelector('.subject_new').innerText;
          row.querySelector('.subject_new').innerText = this.convertToTitleCase(threadName);
        } else {
          let threadName = row.querySelector('.mobile-link > div > span > span > a').innerText;
          row.querySelector('.mobile-link > div > span > span > a').innerText = this.convertToTitleCase(threadName);
        }
      }
      catch (err) { }
    });
  }

  convertToTitleCase(threadName) {
    return threadName.replace(/\w\S*/g, (txt) => {
      if (txt === txt.toUpperCase()) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      } else {
        return txt;
      }
    });
  }
};

module.exports = new AntiCapsLockTitles();
