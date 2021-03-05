const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class ShowPostNumbers extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Show Post Numbers",
      default: true,
      description: "Appends post numbers next to timestamps."
    });
  }

  run() {
    $(".post").each(function(index) {
      const postId = parseInt($(this).attr("id").replace("post_", "")) || 0;
      const postNumElement = $(`#post_url_${postId}`).clone().attr({"style": ""}).css({"padding-right": "5px"});
      $(this).find(".post_date:not(.smalltext)").prepend(postNumElement);
    });
  }
};

module.exports = new ShowPostNumbers();
