const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");

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
    this.addScriptToPage("Convo.processFullscreenToggle();");
  }

  addScriptToPage(scriptContent) {
    var script = document.createElement("script");
    script.textContent = scriptContent;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }
};

module.exports = new AutoFullScreen();
