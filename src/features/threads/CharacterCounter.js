const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");
const Threads = require("../../sections/Threads");

const newReplySection = new Section("/newreply.php");
const editPostSection = new Section("/editpost.php");

class CharacterCounter extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Character Counter",
      default: true,
      description: "Adds intelligent character counter to replies.",
      additionalSections: new SectionArray(newReplySection, editPostSection)
    });
    this.numberFormatter = new Intl.NumberFormat("en-US");
  }

  run() {
    let address = location.href;
    switch (address) {
      case this.isMatch(address, "/showthread.php"):
        return this.generateTag(".thread-quickchat", $("#message"));
      case this.isMatch(address, "/newreply.php"):
        return this.generateTag("#new_reply_form > table > tbody > tr:eq(2) > td:eq(0)", $("#message").next().find("textarea"));
      default:
        console.log("test");
    }
  }

  isMatch(address, match) {
    return address.includes(match) ? address : "";
  }

  generateTag(tagContainer, inputElement, backgroundColor = "#1f1f1f", borderColor = "#0E0E0E") {
    let self = this;
    let charCount = inputElement.val().length;
    let threshold = this.calculateThreshold(charCount);
    $(tagContainer).append("<hr>")
      .append($("<div>").css("text-align", "center").attr({"title": "HFX Character Counter"})
        .append($("<div>").css({
          "box-sizing": "border-box",
          "display": "inline-block",
          "width": "170px",
          "margin": "auto",
          "font-size": "14 px",
          "font-weight": "bold",
          "line-height": "32px",
          "background": backgroundColor,
          "border": `1px solid ${borderColor}`,
          "border-radius": "2px"
        }).attr({"id": "CharCounterContainer"})
          .append($("<div>").attr("id", "CharCounterLabel").text(threshold.label).css({"float": "left", "padding-left": "4px", "color": threshold.color}))
          .append($("<div>").attr("id", "CharCounterValue").text(this.numberFormatter.format(charCount)).css({"float": "right", "padding-right": "4px"}))
        ));

    inputElement.on("change keyup paste", function(e) {
      let charCount = e.target.value.length;
      let threshold = self.calculateThreshold(charCount);
      self.updateCharCount(charCount, threshold);
    });
  }

  updateCharCount(charCount, threshold) {
    $("#CharCounterLabel").css("color", threshold.color);
    $("#CharCounterLabel").text(threshold.label);
    $("#CharCounterValue").text(this.numberFormatter.format(parseInt(charCount)));
  }

  calculateThreshold(charCount) {
    if (charCount < 25) { // Global character limit
      return {
        label: "Too Low",
        color: "#FF2121"
      };
    } else if (charCount >= 25 && charCount < 100) { // Between post limit and clover limit
      return {
        label: "Good",
        color: "#00B500"
      };
    } else if (charCount >= 100 && charCount < 12000) { // Between closver limit and L33t limit
      return {
        label: "Clover",
        color: "#AA00FF"
      };
    } else if (charCount >= 12000 && charCount < 30000) { // Between L33t and Ub3r limit
      return {
        label: "Too High (L33t)",
        color: "#FFCC00"
      };
    }
    // Greater than Ub3r limit
    return {
      label: "Too High (Ub3r)",
      color: "#0066FF"
    };
  }
};

module.exports = new CharacterCounter();
