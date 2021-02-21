const Feature = require("../../core/Feature");
const PMs = require("../../sections/PMs");

class QuoteStripping extends Feature {
  constructor() {
    super({
      section: PMs,
      name: "Quote Stripping",
      default: true,
      description: "Removes all but the last quote in a PM conversation."
    });
  }

  run() {
    const textarea = $("#message");
    const origMessage = textarea.val();
    // Strip all but the outter quote and add 2 new lines
    const replace = textarea.val().replace(/^(\[quote=(?:(?!\[quote=)[\s\S]*?))\[quote=[\s\S]+\[\/quote\]\s*([\s\S]+?\[\/quote\]\s*)$/g, "$1$2\n\n");
    // Replace message value with stripped quote
    $("textarea").each(function() {
      $(this).val(replace);
    });

    // Append quote strip checkbox to pm options
    $(".tborder tr:last td:last span")
      .append("<br>")
      .append($("<input>").attr({ type: "checkbox", name: "options[loadMessage]", id: "quoteStrip" }).addClass("checkbox").prop("checked", true))
      .append($("<strong>").text("Strip Quotes: "))
      .append($("<label>").text("remove all quotes but the last.")
        .append("<br>"));

    // Toggle between original and stripped text
    $("#quoteStrip").on("click", function() {
      let text = $(this).is(":checked") ? replace : origMessage;
      $("textarea").each(function() {
        $(this).val(text);
      });
    });
  }
};

module.exports = new QuoteStripping();
