const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");
const Logger = require("../../core/Logger");

class TagNotificationSound extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Tag Notification Sound",
      default: false,
      description: "Play a notification sound when you are tagged in the convo room.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      }
    });
  }

  run() {
    const js = `Convo.socket.on('convo_receivemessage', function(data) {
      var userURL = "https://hackforums.net/member.php?action=profile&uid=" + socket_uid;
      if (data.message.includes(userURL)) {
          new Convo.initSound(convo_sound_src).play();
      }
    });`;

    try {
      this.addScriptToPage(js);
    } catch (err) {
      if (err instanceof DOMException) {
        Logger.warn("Notification sounds cannot be played until you interact with the page.");
      }
    }
  }

  addScriptToPage(scriptContent) {
    const script = document.createElement("script");
    script.textContent = scriptContent;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }
}

module.exports = new TagNotificationSound();
