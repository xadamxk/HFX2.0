const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class PostsOnThread extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Posts On Thread",
      default: true,
      description: "Filters posts on current thread by selected user."
    });
  }

  run() {
    $(".post").each(function(index) {
      let userId = 0;
      let threadId = 0;
      try {
        userId = $(this).find(".author_information .largetext > a").attr("href").split("&uid=")[1];
        $("input[type=hidden]").each(function() {
          if ($(this).attr("name") === "tid") {
            threadId = $(this).attr("value");
          }
        });
      } catch (e) { }

      $(this).find(".author_buttons").append(`
        <a class="postbit_quote" href="/showthread.php?tid=${threadId}&mode=single&uid=${userId}" data-tooltip="Posts on Thread">
          <span>
            <i class="fa fa-file-signature fa-lg" aria-hidden="true"></i>
          </span>
        </a>
      `);
    });
  }
};

module.exports = new PostsOnThread();
