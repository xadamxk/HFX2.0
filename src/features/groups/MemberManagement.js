const Feature = require("../../core/Feature");
const Util = require("../../core/Util");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");

const Groups = require("../../sections/Groups");

const usergroupManagement = new Section("/usercp.php");
const userProfiles = new Section("/member.php");

class MemberManagement extends Feature {
  constructor() {
    super({
      section: Groups,
      name: "Member Management",
      default: false,
      description: "GROUP LEADERS ONLY: Easily add and remove group members directly from their profile.",
      additionalSections: new SectionArray(usergroupManagement, userProfiles)

    });
    this.groupStorageKey = "memberManagementGroups";
  }

  run() {
    const address = location.href;
    if (address.includes("/member.php?action=profile&uid=1306528")) {
      return;
    }
    switch (address) {
      // Profiles
      case Util.isAddressMatch(address, "/member.php?action=profile"):
        return this.appendProfiles();
      // Group management
      case Util.isAddressMatch(address, "/usercp.php?action=usergroups"):
        return this.appendUsergroup();
      default: return "";
    }
  }

  async appendProfiles() {
    const self = this;
    const groupData = await Util.getLocalSetting(self, this.groupStorageKey) || [];

    // Append group management card
    $(".pro-adv-content-feed").prepend(
      $("<div>").addClass("pro-adv-card").css({ padding: "10px" })
        .attr({ "id": "hfxMemberManagement" }));
    $("#hfxMemberManagement").append($("<div>").append("HFX Member Management: Navigate to <a href='https://hackforums.net/usercp.php?action=usergroups'>Group Membership Page</a> and click 'Add Groups' to update your group leader permissions."));
    if (groupData.length > 0) {
      groupData.forEach(groupItem => {
        const { id, name } = groupItem;
        const userbars = $(".pro-adv-groups-group img") || [];
        const userGroups = [];
        userbars.each((index, userbar) => {
          const title = $(userbar).attr("title");
          userGroups.push(title);
        });
        const manageButtonTxt = userGroups.includes(name) ? "Remove" : "Add";
        $("#hfxMemberManagement").append($("<div>").css({ margin: "10px" }).text(`${name}: `).append($("<button>").addClass("hfxToggleGroupMembership").attr({ "value": id, "isadded": userGroups.includes(name) }).text(manageButtonTxt)));
      });
    }

    $(".hfxToggleGroupMembership").on("click", (event) => {
      const isAdded = $(event.target).attr("isadded") || false;
      const groupId = event.target.value;
      const postKey = this.getMyPostKey();
      const username = this.getProfileUsername();
      const userId = this.getProfileUserId();
      if (isAdded === "true") {
        this.removeUser(groupId, postKey, userId);
      } else {
        this.addUser(groupId, postKey, username);
      }
    });
  }

  async appendUsergroup() {
    const self = this;
    const groupData = await Util.getLocalSetting(self, this.groupStorageKey) || [];
    const addGroupDataStr = groupData ? "Update Groups" : "Add Groups";
    const groupsYouLead = $("strong:contains(\"Groups You Lead\")");
    $(groupsYouLead).after($("<button>").css({ float: "right" }).text(addGroupDataStr)
      .attr({ "title": "HFX: Update Member Management Groups", "id": "hfxUpdateMembers" }));

    $("#hfxUpdateMembers").on("click", (event) => {
      const groupsLeadTbody = $(groupsYouLead).parent().parent().parent();
      const groupLeaderData = [];
      $(groupsLeadTbody).find("tr").each((index, tr) => {
        // Do not include the table header or column labels
        if (index > 1) {
          try {
            const groupName = $(tr).find("td:eq(0)").text(); // 1st column
            const groupId = $(tr).find("td:eq(1) a").attr("href").replace("managegroup.php?gid=", ""); // gid from 2nd column link
            groupLeaderData.push({
              "name": groupName,
              "id": groupId
            });
          } catch (e) { }
        }
      });
      // Update group leadership data
      Util.saveLocalSetting(self, self.groupStorageKey, groupLeaderData);
      alert(`HFX Member Management groups updated: ${JSON.stringify(groupLeaderData)}`);
    });
  }

  addUser(gid, postKey, username) {
    $.ajax({
      type: "POST",
      contentType: "application/x-www-form-urlencoded",
      url: "/managegroup.php",
      data: {
        "my_post_key": postKey,
        "action": "do_add",
        "gid": gid,
        "username": username
      },
      success: (data) => {
        location.reload();
      }
    });
  }

  removeUser(gid, postKey, userId) {
    var tempRemoveUserKey = "removeuser[" + userId + "]";

    $.ajax({
      type: "POST",
      contentType: "application/x-www-form-urlencoded",
      url: "/managegroup.php",
      data: {
        "my_post_key": postKey,
        "action": "do_manageusers",
        "gid": gid,
        [tempRemoveUserKey]: userId
      },
      success: (data) => {
        location.reload();
      }
    });
  }

  getProfileUsername() {
    return $(".pro-adv-card .largetext").text() || "";
  }

  getProfileUserId() {
    return window.location.href.replace(/[^0-9]/g, "") || 0;
  }

  getMyPostKey() {
    return $("head").html().match(/my_post_key = "([a-f0-9]+)"/).pop() || null;
  }
};
// Remove action: do_manageusers

module.exports = new MemberManagement();
