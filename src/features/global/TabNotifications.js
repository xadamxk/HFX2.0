const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Text = require("../../configurables/Text");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

class TabNotifications extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Tab Notifications",
      default: true,
      description: "Notifications appear in browser tab.",
      author: {
        name: "device",
        profile: "https://hackforums.net/member.php?action=profile&uid=1255039"
      },
      configurables: new ConfigurableArray(
        new Checkbox({ id: "TNCustomSoundEnable", label: "Enable Custom Sound", default: false }),
        new Text({ id: "TNCustomSoundLink", label: "MP3 Link", default: "https://store2.gofile.io/download/ca848df4-fc96-4496-83e3-457b77fa062c/mixkit-message-pop-alert-2354.mp3" })
      )
    });
  }

  run(settings) {
    const notifyButton = $("#notifycp");
    for (let i = 0; i < notifyButton.length; ++i) {
      notifyButton[i].addEventListener("click", function() {
        document.title = existingTitle;
      });
    }
    // Page attributes
    const notificationElement = $("#notify_number_notify");
    const existingTitle = $(".breadcrumb").find("a").last().text();
    // Use a mutation handler to check if notifications come after DOM is loaded
    const notificationMutationHandler = () => {
      if (this.checkForNotifications(notificationElement, existingTitle)) {
        const isCustomSoundEnabled = Util.getConfigurableValue("TNCustomSoundEnable", this, settings);
        const customSoundLink = Util.getConfigurableValue("TNCustomSoundLink", this, settings);
        // If custom sound is enabled, play custom sound
        if (isCustomSoundEnabled) {
          const sound = new Audio(customSoundLink);
          sound.play();
        }
      }
    };

    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const notificationObserver = new MutationObserver(notificationMutationHandler);
    const obsConfig = { childList: true, characterData: false, attributes: false, subtree: true };

    // Notification observer
    notificationElement.each(function() {
      notificationObserver.observe(this, obsConfig);
    });
    // Check if notification already exists when DOM is loaded
    this.checkForNotifications(notificationElement, existingTitle);
  }

  checkForNotifications(notificationElement, existingTitle) {
    if ($(notificationElement).hasClass("notify-num-displayed")) {
      const notificationCount = $(notificationElement).text();
      document.title = `(${notificationCount}) ${existingTitle}`;
      return true;
    }
  }
};

module.exports = new TabNotifications();
