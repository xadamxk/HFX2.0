const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

class HidePostbitAttributes extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Hide Postbit Attributes",
      default: false,
      description: "Hide default user post attributes.",
      configurables: new ConfigurableArray(
        new Checkbox({ id: "HPAOnlineStatus", label: "Online Status", default: false }),
        new Checkbox({ id: "HPAAvatar", label: "Avatar", default: false }),
        new Checkbox({ id: "HPAUsertitle", label: "Usertitle", default: false }),
        new Checkbox({ id: "HPAUserstars", label: "Userstars", default: false }),
        new Checkbox({ id: "HPAUserbar", label: "Userbar", default: false }),
        new Checkbox({ id: "HPAAwards", label: "Awards", default: false }),
        new Checkbox({ id: "HPAPosts", label: "Posts", default: false }),
        new Checkbox({ id: "HPAThreads", label: "Threads", default: false }),
        new Checkbox({ id: "HPABRating", label: "B-Rating", default: false }),
        new Checkbox({ id: "HPAPopularity", label: "Popularity", default: false }),
        new Checkbox({ id: "HPABytes", label: "Bytes", default: false }),
        new Checkbox({ id: "HPAGameXP", label: "Game XP", default: false }),
        new Checkbox({ id: "HPAWarningLevel", label: "Warning Level", default: false }),
        new Checkbox({ id: "HPASignature", label: "Signature", default: false })
      )
    });
  }

  run(settings) {
    $(".post").each(function() {
      if (Util.getConfigurableValue("HPAOnlineStatus", this, settings)) {
        $(this).find(".post_author > .author_information img.buddy_status").hide();
      }
      if (Util.getConfigurableValue("HPAAvatar", this, settings)) {
        $(this).find(".post_author > .author_avatar").hide();
      }
      // Usertitles are text nodes, which don't support the hidden attribute, must remove the text
      if (Util.getConfigurableValue("HPAUsertitle", this, settings)) {
        $(this).find(".post_author > .author_information > .smalltext").contents().filter((index) => {
          return index === 0;
        }).remove();
      }
      if (Util.getConfigurableValue("HPAUserstars", this, settings)) {
        $(this).find(".post_author > .author_information > .smalltext > img[alt='*']").hide();
      }
      if (Util.getConfigurableValue("HPAUserbar", this, settings)) {
        $(this).find(".post_author > .author_information > .smalltext > img[alt!='*']").hide();
      }
      if (Util.getConfigurableValue("HPAAwards", this, settings)) {
        $(this).find(".post_author > .author_information > .post_myawards").hide();
      }
      if (Util.getConfigurableValue("HPAPosts", this, settings)) {
        $(this).find(".author_label:contains(Posts)").parent().hide();
      }
      if (Util.getConfigurableValue("HPAThreads", this, settings)) {
        $(this).find(".author_label:contains(Threads)").parent().hide();
      }
      if (Util.getConfigurableValue("HPABRating", this, settings)) {
        $(this).find(".author_label:contains(B Rating)").parent().hide();
      }
      if (Util.getConfigurableValue("HPAPopularity", this, settings)) {
        $(this).find(".author_label:contains(Popularity)").parent().hide();
      }
      if (Util.getConfigurableValue("HPABytes", this, settings)) {
        $(this).find(".author_label:contains(βytes)").parent().hide();
      }
      if (Util.getConfigurableValue("HPAGameXP", this, settings)) {
        $(this).find(".author_label:contains(Game XP)").parent().hide();
      }
      if (Util.getConfigurableValue("HPAWarningLevel", this, settings)) {
        $(this).find(".author_label:contains(Warning Level)").parent().hide();
      }
      if (Util.getConfigurableValue("HPASignature", this, settings)) {
        $(this).find(".signature").hide();
      }
    });
    // All statistic attributes hidden, hide container
    if (["HPAPosts", "HPAThreads", "HPABRating", "HPAPopularity", "HPABytes", "HPAGameXP", "HPAWarningLevel"].every(key => this.getSetting(key, settings))) {
      $(".author_statistics").hide();
    }
  }

  getSetting(key, settings) {
    return Util.getConfigurableValue(key, this, settings);
  }
}

module.exports = new HidePostbitAttributes();
