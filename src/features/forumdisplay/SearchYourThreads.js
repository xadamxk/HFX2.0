const Feature = require("../../core/Feature");
const ForumDisplay = require("../../sections/ForumDisplay");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

class SearchYourThreads extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Search Your Threads",
      default: true,
      description: "Adds the Search Your Threads (SYT) button to forums.",
      author: {
        name: "Xerotic",
        profile: "https://hackforums.net/member.php?action=profile&uid=175033"
      },
      configurables: new ConfigurableArray(
        new Checkbox({id: "SYTCustomInput", label: "Username Input", default: true})
      )
    });
  }

  run(settings) {
    const fid = window.location.href.split("fid=")[1];
    $("td.thead").find("div.float_right").find("strong").append(`&nbsp;&nbsp;|&nbsp;&nbsp;<form method="post" action="search.php" style="display:inline">
        <input type="hidden" name="action" value="do_search">
        <input type="hidden" name="matchusername" value="1">
        <input type="hidden" name="forums" value="${fid}">
        <input type="hidden" name="threadprefix" value="any">
        <input type="hidden" name="showresults" value="threads">
        <input type="hidden" name="author" value="${$("span.welcome").find("a").text()}">
        <button type="submit" class="" name="submit" title="Search Your Threads" style=" background: initial; border: initial; padding: initial; color: white; "><i class="fas fa-user-edit fa-lg"></i></button>
    </form>`);

    const author = $("input[name='author']");
    if (Util.getConfigurableValue("SYTCustomInput", this, settings) && author.length > 0) {
      author.clone().attr({"id": "author", "type": "text"})
        .css({
          "background": "#2a2a2a",
          "padding": "8px",
          "border": "1px solid #222",
          "color": "#eee",
          "font-size": "13px",
          "width": "auto"
        })
        .insertAfter("input[name=author]").prev().remove();
    }
  }
}

module.exports = new SearchYourThreads();
