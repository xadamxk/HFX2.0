const Feature = require("../../core/Feature");
const ForumDisplay = require("../../sections/ForumDisplay");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");

const threadSection = new Section("/showthread.php");

class KeyboardNavigationShortcuts extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Keyboard Navigation Shortcuts",
      default: true,
      description: "Jump between pages in forums and threads using arrow keys.",
      additionalSections: new SectionArray(threadSection)
    });
  }

  run() {
    document.onkeydown = (e) => {
      e = e || window.event;
      switch (e.key) {
        case "ArrowLeft":
          if (!this.isEventOnExcludedElements()) {
            return $(".pagination_previous:eq(0)")[0] ? $(".pagination_previous:eq(0)")[0].click() : null;
          }
          break;
        case "ArrowRight":
          if (!this.isEventOnExcludedElements()) {
            return $(".pagination_next:eq(0)")[0] ? $(".pagination_next:eq(0)")[0].click() : null;
          }
      }
    };
  }

  isEventOnExcludedElements() {
    const excludedElements = [
      $("#HFXSearchYourThreads")[0],
      $("#message")[0],
      $("[id^=quickedit_]")[0]
    ];
    // Basic inputs active
    return excludedElements.some(element => {
      return element === document.activeElement;
    }) ||
    // Global convo quick reply is open
    $("#convoGlobalContainer").hasClass("gc-opened") ||
    // PM From Post is active
    $(".hfxPMFromPostInput").toArray().some(element => {
      return element === document.activeElement;
    });
  }
}

module.exports = new KeyboardNavigationShortcuts();
