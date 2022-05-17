const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");
const Section = require("../../core/Section.js");
const SectionArray = require("../../core/SectionArray.js");
const ConfigurableArray = require("../../core/ConfigurableArray.js");
const Stepper = require("../../configurables/Stepper.js");

const Util = require("../../core/Util");

const newReplySection = new Section("/newreply.php");

class AutoDraft extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Auto Draft",
      default: false,
      description: "Auto-saving your replies in threads, so in case your browser or PC crashes, you won't lose what you have typed in as your reply.",
      author: {
        name: "xHeaven", profile: "https://hackforums.net/member.php?action=profile&uid=3193396"
      },
      additionalSections: new SectionArray(newReplySection),
      configurables: new ConfigurableArray(new Stepper({
        id: "removeAfterHours", label: "Clear unused drafts after x hours", step: 1, default: 24
      }))
    });
  }

  run(settings) {
    let messageBox, tid, replyButton;
    const pathName = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    const init = () => {
      if (!urlParams.has("tid")) {
        return false;
      }

      tid = urlParams.get("tid");

      if (pathName === "/showthread.php") {
        messageBox = this.qs("textarea[name='message'][id='message']");
        replyButton = this.qs("#quick_reply_submit");
      }

      if (pathName === "/newreply.php") {
        messageBox = this.qs("textarea:not(#message)");
        replyButton = this.qs("input[type='submit'][name='submit'][value='Post Reply']");
      }

      return !(!messageBox || !tid || !replyButton);
    };

    const restore = () => {
      const draftRaw = localStorage.getItem(`hackforums-auto-draft-${tid}`);
      const draft = JSON.parse(draftRaw);

      if (!draft) {
        return;
      }

      if (!draft.date || !draft.message || draft.message === "") {
        return;
      }

      const draftDate = new Date(draft.date);

      if (isNaN(draftDate.getTime())) {
        return;
      }

      let hoursToCheck = Util.getConfigurableValue("removeAfterHours", this, settings);

      if (isNaN(hoursToCheck) || hoursToCheck < 1) {
        hoursToCheck = 24;
      }

      if (this.isMoreThanXHours(new Date(), draftDate, hoursToCheck)) {
        console.log(`Draft is more than one day old, not restoring. Removing it from cache... - ${tid}`);
        localStorage.removeItem(`hackforums-auto-draft-${tid}`);
        console.log(`Removed! - ${tid}`);
      } else {
        messageBox.value = draft.message;
        console.log(`Draft restored! - ${tid}`);
      }
    };

    const listen = () => {
      messageBox.addEventListener("keyup", this.debounce(() => {
        const draftObj = {
          message: messageBox.value, date: new Date()
        };

        const draft = JSON.stringify(draftObj);

        localStorage.setItem(`hackforums-auto-draft-${tid}`, draft);

        console.log(`Draft saved! - ${tid}`);
      }));

      replyButton.addEventListener("click", () => {
        localStorage.removeItem(`hackforums-auto-draft-${tid}`);
        console.log(`Draft removed because you've replied! - ${tid}`);
      });
    };

    if (!init()) {
      console.log(`HF Auto-Draft init failed. - ${tid}`);
      return;
    }

    restore();

    listen();
  }

  qs(selector, parent = document) {
    return parent.querySelector(selector);
  }

  isMoreThanXHours(date1, date2, hoursToCheck) {
    const diff = date1.getTime() - date2.getTime();
    const hours = diff / (1000 * 60 * 60);

    return hours > hoursToCheck;
  }

  debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }
}

module.exports = new AutoDraft();
