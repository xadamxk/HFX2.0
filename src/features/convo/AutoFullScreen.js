const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");
const Util = require("../../core/Util");

class AutoFullScreen extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Auto Full Screen",
      default: true,
      description: "Automatically full screen the convo room.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      }
    });
  }

  run() {
    Util.addScriptToPage("Convo.processFullscreenToggle();");
  }
};

module.exports = new AutoFullScreen();
