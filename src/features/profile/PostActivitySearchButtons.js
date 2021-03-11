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
        name: "Exalted",
        profile: "https://hackforums.net/member.php?action=profile&uid=4541508"
      },
      additionalSections: new SectionArray(postActivitySection)
    });
  }

  run() {
    if (window.location.href.includes("postactivity.php")) {
      let table = document.querySelector("#content > div > table");
      
      document.querySelector("#content > div > table > tbody > tr:nth-child(1) > td").colSpan = 4;

      var threadsRowHtml = `<td class="tcat" style="text-align: center;"><span class="smalltext"><strong>Threads</strong></span></td>
                            <td class="tcat" style="text-align: center;"><span class="smalltext"><strong>Posts</strong></span></td>`;
      table.rows[1].insertAdjacentHTML("beforeend", threadsRowHtml);
      
      let username = document.querySelector("#content > div > div > a:nth-child(10)").innerText;
      
      for (var i = 2, row; row = table.rows[i]; i++) {
        let forumId = row.getElementsByTagName('a')[0].href.split('=')[1];
        row.insertCell(2).classList.add("trow1");
        row.insertCell(3).classList.add("trow1");
        row.cells[1].style.textAlign = `center`;
        row.cells[2].innerHTML = '<form action="search.php" method="post"><input type="hidden" name="action" value="do_search"> <input type="hidden" name="keywords" value=""> <input type="hidden" name="postthread" value="2"> <input type="hidden" name="author" value="'+username+'"> <input type="hidden" name="matchusername" value="1"> <input type="hidden" name="forums[]" value="'+forumId+'"> <input type="hidden" name="findthreadst" value="1"> <input type="hidden" name="numreplies" value=""> <input type="hidden" name="postdate" value="0"> <input type="hidden" name="pddir" value="1"> <input type="hidden" name="threadprefix" value="any"> <input type="hidden" name="sortby" value="lastpost"> <input type="hidden" name="sortordr" value="desc"> <input type="hidden" name="showresults" value="threads"> <button data-tag="'+username+'\'s threads" data-tooltip="'+username+'\'s threads"type="submit" name="submit" value="Threads"><i class="fa fa-file fa-lg" aria-hidden="true"></i></button></form>';
        row.cells[2].style.textAlign = `center`;
        row.cells[3].innerHTML = '<form action="search.php" method="post"><input type="hidden" name="action" value="do_search"> <input type="hidden" name="keywords" value=""> <input type="hidden" name="postthread" value="1"> <input type="hidden" name="author" value="'+username+'"> <input type="hidden" name="matchusername" value="1"> <input type="hidden" name="forums[]" value="'+forumId+'"> <input type="hidden" name="findthreadst" value="1"> <input type="hidden" name="numreplies" value=""> <input type="hidden" name="postdate" value="0"> <input type="hidden" name="pddir" value="1"> <input type="hidden" name="threadprefix" value="any"> <input type="hidden" name="sortby" value="lastpost"> <input type="hidden" name="sortordr" value="desc"> <input type="hidden" name="showresults" value="posts"> <button data-tag="'+username+'\'s posts" data-tooltip="'+username+'\'s posts" type="submit" name="submit" value="Posts"><i class="fa fa-file-signature fa-lg" aria-hidden="true"></i></button</form>';
        row.cells[3].style.textAlign = `center`;
      }
    }
  }
};

module.exports = new PostActivitySearchButtons();
