const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class ExpandBlockedPosts extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Expand Blocked Posts",
      default: true,
      description: "Automatically expands blocked user's posts. (Overrides HideBlockedPosts)"
    });
  }

  run() {
    if ($("a[onclick*='showIgnoredPost']").length >= 1) {
      // Load posts
      const posts = $("#posts");
      $("a[onclick*='showIgnoredPost']").each(function(index) {
        // Hide Post
        this.click();

        // Post ID
        const postID = $($("a[onclick*='showIgnoredPost']")[index]).attr("onclick").match(/\((.*)\)/)[1];

        // Get ignored users post
        const ignoredpost = $(posts).find(`#post_${postID}`);

        // 'Ignored User' Alert
        ignoredpost.find(".post_date").append("(IGNORED USER)").css("background-color", "#c40d23");
      });
    }
  }
}

module.exports = new ExpandBlockedPosts();
