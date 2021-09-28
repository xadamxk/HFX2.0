const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");

class ShowContractedReplies extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Show Contracted Replies",
      default: true,
      description: "Button to show contracted replies",
      author: "device",
      profile: "https://hackforums.net/member.php?action=profile&uid=1255039"
    });
  }

  run() {
    const breadcrumb = $(".breadcrumb")[0].innerHTML;

    if (breadcrumb.includes("Marketplace")) {
      let button = document.createElement("button");
      button.innerHTML = "Contracted Replies";
      $(button).prependTo($(".float_right.mobile-remove"));
      button.onclick = function() {
        (location.href = location.href + "&mode=contracted");
      };
    }
  }
};

module.exports = new ShowContractedReplies();
