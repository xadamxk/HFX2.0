class ExpandBlockedPosts extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Threads,
      name: "Expand Blocked Posts",
      default: true,
      description: "Automatically expands blocked user's posts.",
      id: "expandblockedposts"
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
};

module.exports = new ExpandBlockedPosts();
