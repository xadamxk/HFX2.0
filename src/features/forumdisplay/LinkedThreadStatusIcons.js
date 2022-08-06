const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");

const ForumDisplay = require("../../sections/ForumDisplay");

const userCPSection = new Section("/usercp.php");

class LinkedThreadStatusIcons extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Linked Thread Status Icons",
      default: true,
      description: "Makes thread status icons clickable in Forums & UserCP.",
      additionalSections: new SectionArray(userCPSection)

    });
  }

  run() {
    const url = window.location.href;
    const isUserCp = url.includes("/usercp.php");
    const rows = isUserCp ? $(".oc-container > div:eq(1)").find("tr") : $("#content").find("tr.inline_row");

    rows.each((index, row) => {
      const threadLinkOld = isUserCp ? $(row).find(".subject_old").attr("href") : $(row).find(".subject_old > a").attr("href");
      const threadLinkNew = isUserCp ? $(row).find(".subject_new").attr("href") : $(row).find(".subject_new > a").attr("href");
      // Thread links have different formats depending on forum link type - get whichever exists
      const threadLink = threadLinkOld || threadLinkNew || null;
      // Get icon element (span)
      const threadStatusIcon = $(row).find(".thread_status")[0];
      const iconClass = $(threadStatusIcon).attr("class");
      // If icon element doesn't have a class, it doesn't have a thread status and is irrelavent
      if (!iconClass || iconClass.length === 0) {
        return;
      }
      // Determine thread status url based on thread status from element class
      const statusLink = this.determineThreadStatusLink(iconClass.split(/\s+/));
      // Wrap status icon with hyperlink
      $(threadStatusIcon).wrap($("<a>").attr("href", `${threadLink}${statusLink}`));
    });
  }

  determineThreadStatusLink(iconClasses) {
    if (
      iconClasses.includes("newfolder") ||
      iconClasses.includes("dot_newfolder") ||
      iconClasses.includes("dot_newhotfolder") ||
      iconClasses.includes("newhotfolder")) {
      return "&action=newpost";
    } else {
      return "&action=lastpost";
    }
  }
}

module.exports = new LinkedThreadStatusIcons();
