const Feature = require("../../core/Feature");
const awards = require("../../sections/Awards");

class ShowRecipientCount extends Feature {
  constructor() {
    super({
      section: awards,
      name: "Show Recipient Count",
      default: true,
      description: "Shows number of recipients on each award page."
    });
  }

  run() {
    const isIndividualAward = window.location.href.includes("myawards.php?awid=") ? "recipients" : "awards";
    $("strong:contains(\"My Awards\")").after($("<span>").addClass("float_right").text([$(".award_sprite").length, isIndividualAward].join(" ")));
  }
}

module.exports = new ShowRecipientCount();
