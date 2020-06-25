const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class HideBlockedPosts extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Hide Blocked Posts",
      default: false,
      description: "Automatically hides blocked user's posts."
    });
  }

  run() {
    if ($("a[onclick*='showIgnoredPost']").length >= 1) {
      $("a[onclick*='showIgnoredPost']").each(function() {
        // Remove Ignore Table
        $(this).parent().closest(".ignored_post").remove();
      });
    }
  }
};

module.exports = new HideBlockedPosts();
