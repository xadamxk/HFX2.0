const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const Profile = require("../../sections/Profile");
const SectionArray = require("../../core/SectionArray");

const postActivitySection = new Section("/postactivity.php");

class PostActivitySearchButtons extends Feature {
  constructor() {
    super({
      section: Profile,
      name: "Post Activity Search Buttons",
      default: true,
      description: "Adds buttons to the post activity page to quickly search for a user's threads or posts in a forum.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      },
      additionalSections: new SectionArray(postActivitySection)
    });
  }

  run() {
    if (window.location.href.includes("postactivity.php")) {
      var table = document.querySelector("#content > div > table > tbody");

      table.querySelector("tr:nth-child(1) > td").setAttribute("colspan", "4");

      var threadsRowHtml = `<td class="tcat" style="text-align: center;"><span class="smalltext"><strong>Threads</strong></span></td>
                            <td class="tcat" style="text-align: center;"><span class="smalltext"><strong>Posts</strong></span></td>`;
      table.querySelector("tr:nth-child(2)").insertAdjacentHTML("beforeend", threadsRowHtml);

      table.querySelectorAll("tr:nth-child(n+3)").forEach((row) => {
        row.querySelector("td:nth-child(2)").setAttribute("style", "text-align: center;");

        var username = document.querySelector("#content > div > div > a:nth-child(10)").innerText;
        var fid = row.querySelector("td:nth-child(1) > a").href.split("=")[1];

        var columnHtml = `
        <td class="trow1" style="text-align: center;">
          <form action="search.php" method="post">
            <input name="action" value="do_search" style="display: none;">
            <input name="keywords" value="" style="display: none;">
            <input name="postthread" value="2" style="display: none;">
            <input name="forums[]" value="${fid}" style="display: none;">
            <input name="author" value="${username}" style="display: none;">
            <input name="matchusername" value="1" style="display: none;">
            <input name="findthreadst" value="1" style="display: none;">
            <input name="numreplies" value="" style="display: none;">
            <input name="postdate" value="0" style="display: none;">
            <input name="pddir" value="1" style="display: none;">
            <input name="threadprefix[]" value="any" style="display: none;">
            <input name="sortby" value="lastpost" style="display: none;">
            <input name="sortordr" value="desc" style="display: none;">
            <input name="showresults" value="threads" style="display: none;">

            <button type="submit" name="submit" value="Search">
              <i class="fa fa-file fa-lg" aria-hidden="true"></i>
            </button>
          </form>
        </td>

        <td class="trow1" style="text-align: center;">
          <form action="search.php" method="post">
            <input name="action" value="do_search" style="display: none;">
            <input name="keywords" value="" style="display: none;">
            <input name="postthread" value="1" style="display: none;">
            <input name="forums[]" value="${fid}" style="display: none;">
            <input name="author" value="${username}" style="display: none;">
            <input name="matchusername" value="1" style="display: none;">
            <input name="findthreadst" value="1" style="display: none;">
            <input name="numreplies" value="" style="display: none;">
            <input name="postdate" value="0" style="display: none;">
            <input name="pddir" value="1" style="display: none;">
            <input name="threadprefix[]" value="any" style="display: none;">
            <input name="sortby" value="lastpost" style="display: none;">
            <input name="sortordr" value="desc" style="display: none;">
            <input name="showresults" value="posts" style="display: none;">

            <button type="submit" name="submit" value="Search">
              <i class="fa fa-file-signature fa-lg" aria-hidden="true"></i>
            </button>
          </form>
        </td>`;

        row.insertAdjacentHTML("beforeend", columnHtml);
      });
    }
  }
};

module.exports = new PostActivitySearchButtons();
