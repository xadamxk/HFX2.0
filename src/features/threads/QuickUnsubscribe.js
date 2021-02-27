const Feature = require("../../core/Feature");
const Logger = require("../../core/Logger");
const Threads = require("../../sections/Threads");

class QuickUnsubscribe extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Quick Unsubscribe",
      default: true,
      description: "Remove all subscriptions for current thread."
    });
  }

  run() {
    const unsubscribeElement = $(".subscription_remove");
    if (unsubscribeElement.length) {
      const postKey = $("head").html().match(/my_post_key = "([a-f0-9]+)"/).pop();
      const threadId = $(unsubscribeElement).find("a").attr("onclick").replace(/\D/g, "");
      $(unsubscribeElement).after($("<li>")
        .append($("<i>").addClass("fa fa-sign-out-alt").css({"font-family": "Font Awesome 5 Pro", "font-size": "11px", "right": "5px", "position": "relative", "font-weight": "900"}))
        .append($("<a>").attr({
          "href": "javascript:void(0)",
          "title": "HFX: Quick Unsubscribe",
          "id": "hfxQuickUnsubscribe"
        }).text("Quick Unsubscribe")));
      $("#hfxQuickUnsubscribe").on("click", () => {
        $.ajax({
          type: "POST",
          url: "/usercp2.php?ajax=1",
          data: `action=removesubscription&my_post_key=${postKey}&tid=${threadId}`,
          success: function(res) {
            location.reload();
          },
          error: function(xhr, status, err) {
            Logger.debug(`Failed to quick unsubscribe from ${threadId}`);
          }
        });
      });
    }
  }
};

module.exports = new QuickUnsubscribe();
