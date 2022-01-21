const Feature = require("../../core/Feature");
const Groups = require("../../sections/Groups");
const Util = require("../../core/Util");

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
    const address = location.href;
    if (Util.isAddressMatch(address, "showgroups.php")) {
      document.querySelectorAll("div.groupContainer > div").forEach((node) => {
        const nameColorMatch = node.querySelector("div.groupLabel > div.groupName > span > strong").innerHTML.match(/"group(\d+)"/);
        const joinGroupMatch = node.querySelector("div.groupDesc > span").innerHTML.match(/href="usercp.php\?action=usergroups&amp;joingroup=(\d+)&amp;my_post_key=(?:\d*\w*)+"/);
        const displayGroupMatch = node.querySelector("div.groupControls").innerHTML.match(/href="usercp.php\?action=usergroups&amp;displaygroup=(\d+)&amp;my_post_key=(?:\d*\w*)+"/);

        let groupId = 0;

        if (displayGroupMatch && displayGroupMatch[1] > 0) groupId = displayGroupMatch[1];
        else if (joinGroupMatch && joinGroupMatch[1] > 0) groupId = joinGroupMatch[1];
        else if (nameColorMatch && nameColorMatch[1] > 0) groupId = nameColorMatch[1];

        const memberPart = node.querySelector("div.groupMembers");
        if (groupId > 0) memberPart.innerHTML = memberPart.innerHTML.replace(/Members: (\d+)/, (match, m1) => `<span>Members: <a href="https://hackforums.net/memberlist.php?group_choice=${groupId}">${m1}</a></span>`);
      });
    }
  }
};

module.exports = new GroupMemberCountLinks();
