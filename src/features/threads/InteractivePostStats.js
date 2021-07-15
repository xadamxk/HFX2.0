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
    $(".post_author").each(function() {
      const userId = $(this).find(".author_information .largetext > a").attr("href").split("&uid=")[1];
      // Loop rows
      $(this).find(".author_row").each(function() {
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
            // TODO: find best implementation
            const donateButton = $(this).find("a:eq(0)");
            console.log($(donateButton));
            $(value).find("a:eq(1)").after($("<div>").addClass("author_value")
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
