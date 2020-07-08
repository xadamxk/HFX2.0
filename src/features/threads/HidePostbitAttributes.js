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
        new Checkbox({ id: "HPAGameXP", label: "Game XP", default: false })
      )
    });
  }

  run(settings) {
    $(".post").each(function (index) {
      if (Util.getConfigurableValue("HPAOnlineStatus", this, settings)) {
        $(this).find(".post_author > .author_information img.buddy_status").remove();
      }
      if (Util.getConfigurableValue("HPAAvatar", this, settings)) {
        $(this).find(".post_author > .author_avatar").remove();
      }
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
      // Posts
      if (Util.getConfigurableValue("HPAPosts", this, settings)) {
        // TODO $(this).find(".post_author > .author_information > .author_statistics > .author_row:eq(0)").remove();
      }
      // // Threads
      // if (Util.getConfigurableValue("", this, settings)) {
      //   //
      // }
      // // B-Rating
      // if (Util.getConfigurableValue("", this, settings)) {
      //   //
      // }
      // // Popularity
      // if (Util.getConfigurableValue("", this, settings)) {
      //   //
      // }
      // // Bytes
      // if (Util.getConfigurableValue("", this, settings)) {
      //   //
      // }
      // // Game XP
      // if (Util.getConfigurableValue("", this, settings)) {
      //   //
      // }
    });
  }
};

module.exports = new HidePostbitAttributes();
