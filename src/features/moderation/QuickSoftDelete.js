const Feature = require("../../core/Feature");
const Moderation = require("../../sections/Moderation");
const Util = require("../../core/Util");

const SectionArray = require("../../core/SectionArray");
const Section = require("../../core/Section");
const searchPage = new Section("/search.php");

class QuickSoftDelete extends Feature {
  constructor() {
    super({
      section: Moderation,
      name: "Quick Soft Delete",
      default: true,
      description: "Delete user posts from search.php",
      additionalSections: new SectionArray(searchPage)
    });
  }

  run() {
    const self = this;
    // Require modcp header
    const modcpNavElement = $("#panel > .panel-nav-lower > .wrapper > .panel_links").find(".modcp")[0];
    if (!modcpNavElement) {
      return;
    }

    // For each row, check for checkbox
    const resultTable = $("#content").find("table.tborder");
    const resultRows = $(resultTable).find("tr.inline_row");
    $(resultRows).each((index, row) => {
      // Only selectable posts
      const lastColumn = $(row).children().last();
      const isSelectable = $(lastColumn).find(".checkbox:first").val() === "1";
      if (!isSelectable) {
        return;
      }

      const postLink = $(row).find("td:eq(1) > span.smalltext > a:last").attr("href");
      const postId = postLink.split("#pid")[1];

      // Append delete button
      $(lastColumn).append(`
      <div style='margin-top:10px'>
        <button id="HFXQuickSoftDelete${index}" title="HFX: Quick Soft Delete">
          <i class="fas fa-trash fa-sm"></i>
        </button>
      </div>
      `);
      document.getElementById(`HFXQuickSoftDelete${index}`).addEventListener("click", () => { self.softDeletePost(postId, index); });
    });
  }

  softDeletePost(postId, index) {
    const postKey = Util.getUserPostKey();
    if (!postKey) {
      return;
    }
    $.ajax({
      type: "POST",
      contentType: "application/x-www-form-urlencoded",
      url: "/editpost.php",
      data: {
        "ajax": "1",
        "action": "deletepost",
        "delete": "1",
        "pid": postId,
        "my_post_key": postKey
      },
      success: (data) => {
        // delete row
        $(`#HFXQuickSoftDelete${index}`).closest("tr").remove();
      }
    });
  }
}

module.exports = new QuickSoftDelete();
