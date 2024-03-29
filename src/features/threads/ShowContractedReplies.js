const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class ShowContractedReplies extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Show Contracted Replies",
      default: true,
      description: "Button to show contracted replies on Marketplace threads",
      author: {
        name: "device",
        profile: "https://hackforums.net/member.php?action=profile&uid=1255039"
      }
    });
  }

  run() {
    let threadId = 0;
    const url = "https://hackforums.net/showthread.php?tid=";
    //  Get thread ID
    if ($(".breadcrumb-back-arrow")[1].href.includes("php?fid=105")) {
      $("input[type=hidden]").each(function() {
        if ($(this).attr("name") === "tid") {
          threadId = $(this).attr("value");
        }
      });
      // Creates a "Contracted replies" button
      let button = document.createElement("button");
      button.innerHTML = "Contracted Posts";
      button.className = "button contracted-posts";
      button.id = "hfxShowContractedReplies";
      $(button).css({
        "padding": "11px",
        "background-color": "#1f1f1f",
        "border": "none",
        "font-size": "14px"
      });
      $(button).prependTo($(".float_right.mobile-remove"));
      button.onclick = function() {
        location.href = url + threadId + "&mode=contracted";
      };
      if (location.href.includes("&mode=contracted")) {
        button.innerHTML = "Back to thread";
        button.onclick = function() {
          location.href = url + threadId;
        };
      }
    }
  }
};

module.exports = new ShowContractedReplies();
