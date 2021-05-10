const Feature = require("../../core/Feature");
const PMs = require("../../sections/PMs");

class TrackingLinks extends Feature {
  constructor() {
    super({
      section: PMs,
      name: "Tracking Links",
      default: true,
      description: "Turns all messages in 'Message Tracking' to clickable hyperlinks."
    });
  }

  run() {
    if (this.isMessageTrackingPage()) {
      // Read tbody
      const readTable = this.getTrackingTableBody("Read Messages");
      this.trackingTableLinks(readTable);

      // Unread tbody
      const unreadTable = this.getTrackingTableBody("Unread Messages");
      this.trackingTableLinks(unreadTable);
    }
  }

  isMessageTrackingPage() {
    return $(".breadcrumb").find("a:contains('Message Tracking')").length > 0;
  }

  getTrackingTableBody(string) {
    return $("#content").find("strong:contains('" + string + "')").parent().parent().parent();
  }

  trackingTableLinks(table) {
    table.find("tr").each(function() {
      if ($(this).find(".checkbox").attr("name") !== undefined) {
        $(this).find("td:eq(1)").html("<a href=\"https://hackforums.net/private.php?action=read&pmid=" +
          (parseInt($(this).find(".checkbox").attr("name").replace(/\D/g, "")) + 1) + "\">" +
          $(this).find("td:eq(1)").text() + "</a>");
      }
    });
  }
}

module.exports = new TrackingLinks();
