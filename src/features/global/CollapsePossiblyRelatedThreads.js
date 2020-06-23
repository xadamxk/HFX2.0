const HFX = require("../../HFX");

class CollapsePossiblyRelatedThreads extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Global,
      name: "Collapse Possibly Related Threads",
      default: false,
      description: "Automatically collapse 'Possibly Related Threads' results.\n\nClick the toggle image to view results"
    });
  }

  run() {
    const collapseImages = {
      "collapse": HFX.Util.getURL("/assets/images/collapse_collapsed.gif"),
      "collapsed": HFX.Util.getURL("/assets/images/collapse_collapsed.gif")
    };
    const prtTitle = $("strong:contains(Possibly Related Threads...)");

    // If Table exists
    if (prtTitle.length > 0) {
      const prtTableRows = prtTitle.parent().parent().siblings();

      prtTableRows.toggle();
      prtTitle.parent().append($("<div>").addClass("expcolimage")
        .append(`<img id='relatedThreadsCollapse' alt='[+]' title='[+]' style='cursor: pointer;' src='${collapseImages.collapse}' />`));

      $("#relatedThreadsCollapse").on("click", function() {
        prtTableRows.toggle();
        togglePRTCollapseAttr(prtTableRows);
      });
    }

    function togglePRTCollapseAttr(prtTableRows) {
      // Not visible
      if (!prtTableRows.is(":visible")) {
        $("#relatedThreadsCollapse").attr("alt", "[-]").attr("title", "[-]").attr("src", collapseImages.collapse);
      } else {
        $("#relatedThreadsCollapse").attr("alt", "[+]").attr("title", "[+]").attr("src", collapseImages.collapsed);
      }
    }
  }
};

HFX.Feature.CollapsePossiblyRelatedThreads = new CollapsePossiblyRelatedThreads();

module.exports = HFX;
