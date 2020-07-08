const Feature = require("../../core/Feature");
const ForumDisplay = require("../../sections/ForumDisplay");

class HideClosedThreads extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Hide Closed Threads",
      default: false,
      description: "Removes all closed threads in forums."
    });
  }

  run() {
    $(".thread_status").each(function (index) {
      if ($(this).attr("title").includes("Locked thread.")) {
        $(this).parent().parent().remove();
      }
    });
  }
};

module.exports = new HideClosedThreads();
