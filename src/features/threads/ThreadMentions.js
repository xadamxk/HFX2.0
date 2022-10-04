const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class ThreadMentions extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Thread Mentions",
      default: true,
      description: "Mention users with the click of a button."
    });
  }

  run() {
    const self = this;
    $(".post").each(function(index) {
      const posterURL = $(this).find(".author_information a").eq(0).attr("href");
      const posterUID = posterURL.split("?action=profile&uid=")[1];
      $(this).find(".post_management_buttons").prepend(`
      <a class="hfx-user-mention postbit_quote" href="#" id="HFXUserMention${index}" data-tooltip="Mention User" onclick="event.preventDefault()">
        <span style="padding-top:5px">
          <i class="fa fa-tag fa-lg" aria-hidden="true"></i>
        </span>
      </a>
    `);
      document.getElementById(`HFXUserMention${index}`).addEventListener("click", () => { self.appendMentionToInput(posterUID); });
    });
  }

  appendMentionToInput(userId) {
    if (!userId) {
      return;
    }
    const currentInput = $("#message").val();
    const newInput = currentInput + `[mention=${userId}] `;
    $("#message").val(newInput);
  };
}

module.exports = new ThreadMentions();
