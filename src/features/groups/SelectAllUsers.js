const Feature = require("../../core/Feature");
const Groups = require("../../sections/Groups");
const Util = require("../../core/Util");

const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");

const manageGroup = new Section("/managegroup.php");

class SelectAllUsers extends Feature {
  constructor() {
    super({
      section: Groups,
      name: "Select All Users",
      default: true,
      description: "GROUP LEADERS ONLY: Add select all checkbox to manage group page.",
      additionalSections: new SectionArray(manageGroup)
    });
  }

  run() {
    const address = location.href;
    switch (address) {
      // Profiles
      case Util.isAddressMatch(address, "/managegroup.php"):
        return this.appendCheckBox();
    }
  }
  appendCheckBox() {
    const memberTableColumn = $("table:eq(1) > tbody:eq(0) > tr:eq(1) > td:eq(5)");
    $(memberTableColumn).empty();
    // Create elements
    const allCheckBox = $("<input>").attr({"type": "checkbox", "id": "hfxAllCheckbox"});
    const allLabel = $("<span>").addClass("smalltext").append($("<strong>").text("All"));

    // Append elements
    $(memberTableColumn).append(allLabel);
    $(memberTableColumn).append(allCheckBox);

    $("#hfxAllCheckbox").on("click", (event) => {
      const isChecked = event.target.checked;
      $(".checkbox").prop("checked", isChecked);
    });
  }
};

module.exports = new SelectAllUsers();
