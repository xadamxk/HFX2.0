const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

class EasyCite extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Easy Cite",
      default: true,
      description: "Click the breadcumb to quickly cite pages.",
      configurables: new ConfigurableArray(
        new Checkbox({ id: "ECProfileColors", label: "Profile Colors", default: true }),
        new Checkbox({ id: "ECUsernameColors", label: "Username Colors", default: true }),
        new Checkbox({ id: "ECLinkUsernameForPosts", label: "Link Username for Posts", default: true }),
        new Checkbox({ id: "ECProfileColors", label: "Cite Posts", default: true })
      )
    });
  }

  run() {
    let address = location.href;
    let citationText = this.getAppropriateCitation(address);
    console.log(citationText);
    $("#citeButton").click(function(event) {
      var target = $(event.target);
      if (target.is("a") || target.is("span")) {
        var textarea = $("<textarea/>");
        textarea.text(`[url=${address}][b]${citationText}[/b][/url]`);
        $("body").append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      // TODO: Alert of some kind that citation was 'Copied'
    });
  }

  copyToClipboard(text) {

  }

  getAppropriateCitation(address) {
    let breadcrumb = $(".breadcrumb").find("a").last().attr({ "id": "citeButton", title: "Cite Page", "href": "javascript:void()" }).text();
    switch (address) {
      case this.isMatch(address, "/myawards.php?uid="):
        return this.getDescription(`'s ${breadcrumb}`, $("#content").find("strong:contains('My Awards : ')").text().replace("My Awards : ", ""));
      case this.isMatch(address, "/myawards.php?awid="):
        return this.getDescription(" Award", $("#content").find(".award_sprite:eq(0)").attr("title"));
      case this.isMatch(address, "/trustscan.php?uid="):
        return this.getDescription("'s Trust Scan", $("#content").find("strong:contains('Trust Scan of')").text().replace("Trust Scan of ", ""));
      case this.isMatch(address, "/forumdisplay.php?fid="):
        return this.getDescription("Section").replace("  ", " "); // RANF Section has two spaces between Rules, Announcements
      case this.isMatch(address, "/member.php?action=profile"):
        return this.getDescription("'s Profile").replace("Profile of ", "");
      case this.isMatch(address, "/misc.php?action=help"):
        return this.getDescription("- Help Documents");
      case this.isMatch(address, "/disputedb.php"):
        return this.getDescription("- Deal Dispute");
      case this.isMatch(address, "/reputation.php?uid="):
      case this.isMatch(address, "/repsgiven.php?uid="):
        return this.getDescription("'s Popularity", $("#content").find("strong:contains('Popularity Report for')").text().replace("Popularity Report for ", ""));
      default: return breadcrumb;
    }
  }

  isMatch(address, match) {
    return address.includes(match) ? address : "";
  }

  getDescription(suffix, selector = false) {
    if (selector) {
      return selector + suffix;
    }
    let seperator = suffix.includes("'s") ? "" : " ";
    return [$("#citeButton").text(), suffix].join(seperator);
  }
};

module.exports = new EasyCite();
