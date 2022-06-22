const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class InteractivePostStats extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Interactive Post Stats",
      default: true,
      description: "Makes all post statistics clickable."
    });
  }

  run() {
    // Loop post author
    $(".post").each(function() {
      const postbitTable = $(this).find(".post_author");
      try {
        const userId = $(postbitTable).find(".author_information .largetext > a").attr("href").split("&uid=")[1];
      }
      catch(err) {
        // https://stackoverflow.com/a/17162375
        return;
      }
      const postId = $(this).attr("id").replace("post_", "");
      // Loop rows
      $(postbitTable).find(".author_row").each(function() {
        const label = $(this).find(".author_label").text().toLowerCase();
        const value = $(this).find(".author_value");
        const valueText = $(value).text();
        switch (label) {
          case "posts:":
            $(value).replaceWith($("<div>").addClass("author_value")
              .append($("<a>").attr({"href": `https://hackforums.net/search.php?action=finduser&uid=${userId}`}).text(valueText)));
            break;
          case "threads:":
            $(value).replaceWith($("<div>").addClass("author_value")
              .append($("<a>").attr({"href": `https://hackforums.net/search.php?action=finduserthreads&uid=${userId}`}).text(valueText)));
            break;
          case "βytes:":
            $(value).replaceWith($("<div>").addClass("author_value")
              .append($("<a>").attr({"href": "javascript:void(0)", "onclick": `MyBB.popupWindow('/myps.php?action=donate&uid=${userId}&pid=${postId}&modal=1'); return false;`})
                .append($("<i>").addClass("fa fa-plus-circle").css({"color": "#4CAF50"}).attr({"aria-hidden": "true"})))
              .append($("<a>").attr({"href": `https://hackforums.net/myps.php?action=history&uid=${userId}`}).text(valueText)));
            break;
          default:
            ; // Nothing
        }
      });
    });
  }
};

module.exports = new InteractivePostStats();
