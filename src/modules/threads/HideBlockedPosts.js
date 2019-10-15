class HideBlockedPosts extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Threads,
      name: "Hide Blocked Posts",
      default: false,
      description: "Automatically hides blocked user's posts.",
      id: "showblockedposts"
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
