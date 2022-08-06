const Feature = require("../../core/Feature");
const Util = require("../../core/Util");
const ForumDisplay = require("../../sections/ForumDisplay");

class PrefixLinks extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Prefix Links",
      default: true,
      description: "Filter threads in forums via prefix by clicking any prefix."
    });
  }

  run() {
    // Get all prefix options from prefix dropdown
    const prefixOptions = $("select[name='prefix']").children();
    if (!prefixOptions || prefixOptions.length === 0) {
      return;
    }

    // Filter options (remove any, no, and any/no)
    const validPrefixOptions = prefixOptions.filter((index, prefix) => {
      return $(prefix).val() > 0;
    });

    const forumId = Util.getUrlParameterValue("fid");

    // Apply link to prefixes on page
    $(".prefix").each((index, prefixElement) => {
      const trimmedPrefix = this.getTrimmedPrefix($(prefixElement).text());
      const matchingOptionValue = this.findMatchingPrefixOptionValue(trimmedPrefix, validPrefixOptions.toArray());
      if (matchingOptionValue) {
        $(prefixElement).empty();
        $(prefixElement).append($("<a>").attr("href", `https://hackforums.net/forumdisplay.php?fid=${forumId}&prefix=${matchingOptionValue}`)
          .append($("<span>").addClass("prefix").text(`[${trimmedPrefix}]`)));
      }
    });
  }

  findMatchingPrefixOptionValue(prefix, prefixOptions) {
    const matchingPrefixOption = prefixOptions.find(element => {
      const trimmedPrefixOption = $(element).text().replace("Prefix: ", "").trim();
      return trimmedPrefixOption.toUpperCase().includes(prefix.toUpperCase());
    });
    return matchingPrefixOption ? $(matchingPrefixOption).val() : null;
  }

  getTrimmedPrefix(prefix) {
    if (prefix.includes("[") && prefix.includes("]")) {
      return prefix.slice(1, -1);
    }
    return prefix;
  }
}

module.exports = new PrefixLinks();
