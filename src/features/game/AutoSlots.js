const Feature = require("../../core/Feature");
const Game = require("../../sections/Game");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Stepper = require("../../configurables/Stepper");
const Checkbox = require("../../configurables/Checkbox");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");

const slotsSection = new Section("/slots.php");

class AutoSlots extends Feature {
  constructor() {
    super({
      section: Game,
      name: "Auto Slots",
      default: true,
      description: "Play slots automatically based on settings.",
      configurables: new ConfigurableArray(
        new Stepper({ id: "ASGamesPerSession", label: "Games Per Session", step: 1, default: 20 }),
        new Checkbox({ id: "ASConfirmRounds", label: "Manual Confirmation between Round", default: false })
      ),
      additionalSections: new SectionArray(slotsSection)
    });
    this.slotsConfig = {
      "numIconsPerReel": 6, // Number of icons per reel
      "stripHeight": 720, // Height of reel image in pixels
      "alignmentOffset": 86, // Offset for reel to match container
      "positioningTime": 0, // reel animation default: 200
      "bounceHeight": 0, // reel animation default: 200
      "bounceTime": 0 // reel animation default: 1000
    };
  }

  run() {
    const currentPageUrl = location.href;
    // Don't do anything if not slots
    if (currentPageUrl.includes("/slots.php")) {
      // Shrink slots UI td
      $("#PageContainer").parent().css("width", $("#PageContainer").css("width"));
      // Append stats td
      $("#PageContainer").parent().after($("<td>").addClass("trow1")
        .append($("<div>").css("height", $("#PageContainerInner").css("height"))
          .append($("<div>").attr("id", "hfgsStatsContainer"))));
      // Append warning
      $("#hfgsStatsContainer").append($("<tr>").css("color", "red").text("HFX Warning: USE AT YOUR OWN RISK!"));
      // Append slots history table
      const tableAttributes = {
        "border": "0",
        "cellspacing": "0",
        "cellpadding": "5",
        "class": "tborder",
        "margin": "10px auto",
        "width": "100% !important",
        "id": "historyTable" };
      const tbodyCSS = {
        "overflow-y": "auto",
        "overflow-x": "hidden !important",
        "max-height": "250px"
      };
      const trCSS = {};
      $("#hfgsStatsContainer").append($("<table>").attr(tableAttributes)
        .append($("<tbody>").attr("id", "historyTabletbody").css(tbodyCSS)
          .append($("<tr>").css(trCSS)
            .append($("<td>").addClass("thead").attr("colspan", "4")
              .append($("<strong>").text("HF Slots Bot History"))))
          .append($("<tr>").css(trCSS)
            .append($("<td>").addClass("tcat").attr("colspan", "1")
              .append($("<strong>").text("Result")))
            .append($("<td>").addClass("tcat").attr("colspan", "1")
              .append($("<strong>").text("Date")))
            .append($("<td>").addClass("tcat").attr("colspan", "1")
              .append($("<strong>").text("Wagered")))
            .append($("<td>").addClass("tcat").attr("colspan", "1")
              .append($("<strong>").text("Received")))
          )
        )
      );

      // // Append warning
      // $("strong:contains(\"Risk your βytes for a chance to win more!\")").parent().parent().parent().find("tr:eq(2)")
      //   .after($("<tr>").append($("<td>").addClass("trow1").attr({"id": "hfxSlotsContainer", "colspan": "2"})))
      //   .after($("<tr>").css("color", "red").text("HFX Additions: USE AT YOUR OWN RISK!"));

      // Append auto button
      $("#hfgsStatsContainer").append($("<div>").css({"text-align": "center", "margin": "10px"})
        .append($("<button>").attr({"title": "HFX Auto Spin", "id": "hfxAutoSpin"}).text("RUN AUTO SPIN")));
    }
  }
};

module.exports = new AutoSlots();
