const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class PMFromPost extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "PM From Post",
      default: true,
      description: "Allows you to PM members from their post."
    });
  }

  run() {
    const threadTitle = $(".breadcrumb a").last().text().substring(0, 50);
    this.startDynamicListeners();

    $(".post").each(function (index) {
      const myPostKey = $("head").html().match(/my_post_key = "([a-f0-9]+)"/).pop();
      const postId = $(this).attr("id").split("_").pop();
      const postLink = $(this).find(`#post_url_${postId}`).attr("href");
      const postUser = $(this).find(".author_information a").eq(0).text();

      let postQuote = $(this).find(".post_body").clone();
      postQuote.find("blockquote").remove(); // Remove quotes
      postQuote.find(".codeblock").each((i, e) => $(e).replaceWith(`<span>[code]\n${$(e).find("code").text()}\n[/code]`)); // Fix code blocks
      postQuote = postQuote.text()
        .replace(/\t+/g, "")
        .replace(/\n\s*\n/g, "\n");
      postQuote = `[quote="${postUser}" pid="${postId}"]${postQuote}[/quote]`;
      postQuote = `[size=x-small]Sent from [url=${postLink}]your post[/url].[/size]\n${postQuote}\n`;

      $(this).find(".author_buttons").prepend(`
        <a class="pm-from-post-toggle postbit_quote" href="#" data-tooltip="PM From Post">
          <span>
            <i class="fa fa-comment fa-lg" aria-hidden="true"></i>
          </span>
        </a>
      `);

      $(this).append(`
        <div class="pm-from-post-container py-3">
          <form action="private.php" method="post" name="input" target="_blank">
            <input type="hidden" name="action" value="do_send" />
            <input type="hidden" name="pmid" value="" />
            <input type="hidden" name="do" value="" />
            <input type="hidden" name="icon" value="" />
            <input type="hidden" name="my_post_key" value="${myPostKey}" />
            <input type="hidden" name="uid" value="${postUser}" />
            <div class="text-center my-3">
              <div class="mb-3">
                <span>
                  <strong>Recipients:</strong>
                  <input type="text" class="textbox" name="to" value="${postUser}" readonly />
                </span>
                <span class="ml-5">
                  <strong>Subject:</strong>
                  <input type="text" class="textbox" name="subject" size="40" maxlength="85" value="Regarding Your Post: ${threadTitle}" />
                </span>
              </div>
              <textarea name="message" rows="7" cols="90">${postQuote}</textarea>
            </div>
            <div class="text-center my-3">
              <span>
                <input type="checkbox" class="checkbox" name="options[signature]" value="1" checked />
                Signature
              </span>
              -
              <span>
                <input type="checkbox" class="checkbox" name="options[savecopy]" value="1" checked />
                Save a Copy
              </span>
              -
              <span>
                <input type="checkbox" class="checkbox" name="options[readreceipt]" value="1" checked />
                Request Read Receipt
              </span>
            </div>
            <div class="text-center my-3">
              <input type="submit" class="button pm-from-post-button send" name="submit" value="Send Message" />
              <input type="submit" class="button pm-from-post-button" name="saveasdraft" value="Save as Draft" />
              <input type="submit" class="button pm-from-post-button" name="preview" value="Preview" />
            </div>
          </form>
        </div>
      `);
    });
  }

  startDynamicListeners() {
    // Listen for toggle
    $(".post").on("click", ".pm-from-post-toggle", function (e) {
      e.preventDefault();
      $(this).closest(".post").find(".pm-from-post-container").toggle();
    });

    // Listen for send
    $(".post").on("click", ".pm-from-post-button.send", function (e) {
      $(this).closest(".pm-from-post-container").hide();
    });
  }
};

module.exports = new PMFromPost();
