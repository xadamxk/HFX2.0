require("../../_core/HFX");
class CollapsePossiblyRelatedThreads extends HFX.Feature {
  constructor () {
    super({
      section: "global",
      name: "Collapse Possibly Related Threads",
      default: 1,
      description: "Automatically collapse 'Possibly Related Threads' results.\n\nClick the toggle image to view results",
      id: "collapsepossiblylrelatedthreads"
    });
  }

  run () {
    var collapseImages = {"collapse": chrome.extension.getURL("/assets/images/collapse_collapsed.gif"), "collapsed": chrome.extension.getURL("/assets/images/collapse_collapsed.gif")};
    var prtTitle = $("strong:contains(Possibly Related Threads...)");
    // If Table exists
    if (prtTitle.length > 0) {
      var prtTableRows = prtTitle.parent().parent().siblings();

      prtTableRows.toggle();
      prtTitle.parent().append($("<div>").addClass("expcolimage")
        .append(`<img id='relatedThreadsCollapse' alt='[+]' title='[+]' style='cursor: pointer;' src='${collapseImages.collapse}' />`));

      $("#relatedThreadsCollapse").on("click", function () {
        prtTableRows.toggle();

        togglePRTCollapseAttr(prtTableRows);
      });
    }

    function togglePRTCollapseAttr (prtTableRows) {
      // Not visible
      if (!prtTableRows.is(":visible")) {
        $("#relatedThreadsCollapse").attr("alt", "[-]").attr("title", "[-]").attr("src", collapseImages.collapse);
      } else {
        $("#relatedThreadsCollapse").attr("alt", "[+]").attr("title", "[+]").attr("src", collapseImages.collapsed);
      }
    }
  }
};

module.exports = new CollapsePossiblyRelatedThreads();
