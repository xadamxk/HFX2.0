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
      description: "Easily add and remove group members directly from their profile.",
      additionalSections: new SectionArray(usergroupManagement, userProfiles)

    });
    this.groupStorageKey = "memberManagementGroups";
  }

  run() {
    const address = location.href;
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
    // TODO: If groupData is empty, append info to forward user to group management page
    groupData.forEach(groupItem => {
      const { id, name } = groupItem;
      const userbars = $(".pro-adv-groups-group img") || [];
      const userGroups = [];
      userbars.each((index, userbar) => {
        const title = $(userbar).attr("title");
        userGroups.push(title);
      });
      const manageButtonTxt = userGroups.includes(name) ? "Remove" : "Add";
      $("#hfxMemberManagement").append($("<div>").text(`${name}: `).append($("<button>").attr({ "value": id }).text(manageButtonTxt)));
    });
  }

  async appendUsergroup() {
    const self = this;
    const groupData = await Util.getLocalSetting(self, this.groupStorageKey) || [];
    const addGroupDataStr = groupData ? "Update Groups" : "Add Groups";
    const groupsYouLead = $("strong:contains(\"Groups You Lead\")");
    $(groupsYouLead).after($("<button>").css({ float: "right" }).text(addGroupDataStr)
      .attr({ "title": "HFX: Update Member Management Groups", "id": "hfxUpdateMembers" }));

    $("#hfxUpdateMembers").on("click", function(event) {
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
};

module.exports = new MemberManagement();
