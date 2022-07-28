const Feature = require("../../core/Feature");
const Profile = require("../../sections/Profile");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

class ExpandProfileSections extends Feature {
  constructor() {
    super({
      section: Profile,
      name: "Expand Profile Sections",
      default: true,
      description: "Expands profile visitors, groups, awards, and comrades on member profiles.",
      configurables: new ConfigurableArray(
        new Checkbox({ id: "EPSExpandAwards", label: "Expand Awards", default: true }),
        new Checkbox({ id: "EPSShowVisitorNames", label: "Show Visitor Names", default: true }),
        new Checkbox({ id: "EPSShowComradeNames", label: "Show Comrade Names", default: true })
      )
    });
  }

  run(settings) {
    // Profile username
    const profileUsername = $(".Aligner").find(".largetext").text();
    const profileUID = location.href.split("uid=")[1] || "";

    // Append cards in reverse order
    // Comrades
    const comradesContainer = $(".pro-adv-buddy-group");
    this.appendProfileCard(comradesContainer, "Comrades", profileUsername, "hfxComradeCard");

    if (Util.getConfigurableValue("EPSShowComradeNames", this, settings)) {
      this.appendProfileNames("#hfxComradeCard > div");
    }

    // Awards
    const awardsContainer = $(".pro-adv-awards-group");
    if (Util.getConfigurableValue("EPSExpandAwards", this, settings)) {
      // custom
      this.appendAwardCard(awardsContainer, profileUsername, profileUID);
    } else {
      this.appendProfileCard(awardsContainer, "Awards", profileUsername, "hfxAwardCard");
    }

    // Groups
    const groupsContainer = $(".pro-adv-groups-group");
    this.appendProfileCard(groupsContainer, "Groups", profileUsername, "hfxGroupsCard");

    // Profile Views
    const profileViewersContainer = $(".pro-adv-visitor-group");
    this.appendProfileCard(profileViewersContainer, "Profile Visitors", profileUsername, "hfxProfileVisitors");

    if (Util.getConfigurableValue("EPSShowVisitorNames", this, settings)) {
      this.appendProfileNames("#hfxProfileVisitors > div");
    }

    // Remove original section
    $(".pro-adv-visitor-group").parent().parent().hide();
  }

  appendProfileNames(selector) {
    if (!$(selector)) { return; }
    $(selector).each((index, profileContainer) => {
      if (index !== 0) {
        const profile = $(profileContainer).find("a:first");
        const profileName = $(profile).attr("title");
        $(profile).prepend($("<div>")
          .css({"text-align": "center", "font-weight": "bold", "font-size": "10px"})
          .text(profileName));
      }
    });
  }

  appendProfileCard(container, title, username, id) {
    const elements = $(container).children().clone();
    $(container).parent().parent().after(
      $("<div>").addClass("pro-adv-card pro-adv-card-p-5").attr({"id": id})
        .append($("<strong>").text([username, title].join(" ")))
        .append($("<div>").css({"margin": "5px", "margin-bottom": "10px"}).append("<hr>"))
        .append(elements)
    );
  }

  appendAwardCard(awardsContainer, username, uid) {
    // Append table for awards
    const awardCount = $(awardsContainer).find(".award_sprite").length;
    $(awardsContainer).parent().parent().after(
      $("<div>").addClass("pro-adv-card pro-adv-card-p-5").css({"max-height": "450px", "overflow-y": "scroll"})
        .append($("<table>").css({"width": "100%"}).addClass("tborder").attr({"border": "0", "cellspacing": "0", "cellpadding": "5"})
          .append($("<tbody>").attr({"id": "epsAwardTbody"})
            .append($("<tr>")
              .append($("<td>").addClass("thead").attr({"colspan": "3"})
                .append($("<strong>").append(`<a href="https://hackforums.net/myawards.php?uid=${uid}">${username} Awards (${awardCount})</a>`))
              ))
            .append($("<tr>")
              .append($("<td>").addClass("tcat").attr({"width": "15%"}).append($("<strong>").text("Award")))
              .append($("<td>").addClass("tcat").attr({"width": "25%"}).append($("<strong>").text("Name")))
              .append($("<td>").addClass("tcat").append($("<strong>").text("Reason")))
            )))
    );
    // Append awards to table
    $(awardsContainer).find(".award_sprite").each(function() {
      const awardTitle = $(this).attr("title");
      const awardId = $(this).attr("class").replace("award_sprite award_", "");
      const name = awardTitle.split("-")[0].trim();
      const description = awardTitle.substring(awardTitle.indexOf("-") + 1).trim();
      $("#epsAwardTbody").append($("<tr>")
        .append($("<td>").addClass("tcat").addClass("trow1").append($(this)))
        .append($("<td>").addClass("tcat").addClass("trow1").append($("<strong>").append($("<a>").text(name).attr("href", `/myawards.php?awid=${awardId}`)))) // .text(name)
        .append($("<td>").addClass("tcat").addClass("trow1").append($("<strong>").text(description)))
      );
    });
  }
}

module.exports = new ExpandProfileSections();
