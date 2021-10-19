const Feature = require("../../core/Feature");
const Groups = require("../../sections/Groups");

class GroupMemberCountLinks extends Feature {
  constructor() {
    super({
      section: Groups,
      name: "Group Member Count Links",
      default: true,
      description: "Click the member count on the forum groups page to view the members of a group.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      }
    });
  }

  run() {
    document.querySelectorAll("div.groupContainer > div").forEach((node) => {
      const groupId = node.querySelector("div.groupLabel > div.groupName > span > strong").innerHTML.match(/"group(\d+)"/)[1];
      const memberPart = node.querySelector("div.groupMembers");
      memberPart.innerHTML = memberPart.innerHTML.replace(/Members: (\d+)/, (match, m1) => `<span>Members: <a href="https://hackforums.net/memberlist.php?group_choice=${groupId}">${m1}</a></span>`);
    });
  }
};

module.exports = new GroupMemberCountLinks();
