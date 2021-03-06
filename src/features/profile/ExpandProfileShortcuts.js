const Feature = require("../../core/Feature");
const Profile = require("../../sections/Profile");

class ExpandProfileShortcuts extends Feature {
  constructor() {
    super({
      section: Profile,
      name: "Expand Profile Shortcuts",
      default: true,
      description: "Appends ellipsis profile shortcuts to existing shortcut header."
    });
  }

  run() {
    // Append spacer
    $(".pro-adv-container > div:eq(1) > div.float_right").append($("<span>").text("|"));
    // Loop ellipsis shortcuts
    $(".pro-adv-content-info > .pro-adv-card:eq(0) > div:eq(0) > div.pro-adv-card-dotoptions").children().each(function() {
      const icon = $(this).find("i").clone().removeAttr("style");
      const aElement = $(this).find("a");
      const link = $(aElement).attr("href");
      const onClick = $(aElement).attr("onclick");
      const text = $(this).text().trim();
      $(".pro-adv-container > div:eq(1) > div.float_right").append(
        $("<a>").attr({"href": link, "data-tooltip": text, "onclick": onClick}).css({"display": "inline-block", "line-height": "37px", "padding": "0px 15px"})
          .append(icon)
      );
    });
  }
};

module.exports = new ExpandProfileShortcuts();
