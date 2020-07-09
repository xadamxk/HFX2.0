const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Text = require("../../configurables/Text");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

const Sticky = require("sticky-js");

class HFToolBar extends Feature {
  constructor() {
    super({
      section: Global,
      name: "HF Tool Bar",
      default: true,
      description: "Adds a toolbar with various options to the navigation header.",
      configurables: new ConfigurableArray(
        new Checkbox({ id: "HFTPStickyHeader", label: "Sticky Header", default: true }),
        new Checkbox({ id: "HFTPHomeShortcut", label: "UserCP Shortcut", default: true }),
        new Text({ id: "HFTPFav1Text", label: "Favorite1 Text", default: "Lounge" }),
        new Text({ id: "HFTPFav1Link", label: "Favorite1 Link", default: "/forumdisplay.php?fid=25" }),
        new Text({ id: "HFTPFav2Text", label: "Favorite2 Text", default: "RANF" }),
        new Text({ id: "HFTPFav2Link", label: "Favorite2 Link", default: "/forumdisplay.php?fid=2" }),
        new Text({ id: "HFTPFav3Text", label: "Favorite3 Text", default: "Groups" }),
        new Text({ id: "HFTPFav3Link", label: "Favorite3 Link", default: "/forumdisplay.php?fid=52" }),
        new Text({ id: "HFTPFav4Text", label: "Favorite4 Text", default: "PM Tracking" }),
        new Text({ id: "HFTPFav4Link", label: "Favorite4 Link", default: "/private.php?action=tracking" }),
        new Text({ id: "HFTPFav5Text", label: "Favorite5 Text", default: "" }),
        new Text({ id: "HFTPFav5Link", label: "Favorite5 Link", default: "" }),
        new Text({ id: "HFTPFav6Text", label: "Favorite6 Text", default: "" }),
        new Text({ id: "HFTPFav6Link", label: "Favorite6 Link", default: "" }),
        new Text({ id: "HFTPFav7Text", label: "Favorite7 Text", default: "" }),
        new Text({ id: "HFTPFav7Link", label: "Favorite7 Link", default: "" })
      )
    });
  }

  run(settings) {
    if (this.getSetting("HFTPStickyHeader", settings)) {
      $(".panel-nav-lower").attr({ "data-margin-top": "0" }).addClass("sticky").css({ "z-index": 100 });
      let sticky = new Sticky(".sticky");
      sticky.update();
    }

    if (this.getSetting("HFTPHomeShortcut", settings)) {
      $(".panel_links").prepend(`
        <li><a href="/usercp.php" data-tooltip="UserCP"><i class="fa fa-cog fa-lg" aria-hidden="true"></i></a></li>
      `);
    }
    this.appendShortcut(this.getSetting("HFTPFav1Link", settings), this.getSetting("HFTPFav1Text", settings));
    this.appendShortcut(this.getSetting("HFTPFav2Link", settings), this.getSetting("HFTPFav2Text", settings));
    this.appendShortcut(this.getSetting("HFTPFav3Link", settings), this.getSetting("HFTPFav3Text", settings));
    this.appendShortcut(this.getSetting("HFTPFav4Link", settings), this.getSetting("HFTPFav4Text", settings));
    this.appendShortcut(this.getSetting("HFTPFav5Link", settings), this.getSetting("HFTPFav5Text", settings));
    this.appendShortcut(this.getSetting("HFTPFav6Link", settings), this.getSetting("HFTPFav6Text", settings));
    this.appendShortcut(this.getSetting("HFTPFav7Link", settings), this.getSetting("HFTPFav7Text", settings));

  }

  getSetting(key, settings) {
    return Util.getConfigurableValue(key, this, settings);
  }

  appendShortcut(favLink, favName) {
    if (favLink && favName) {
      $(".panel_links").append(`
        <li><a href="${favLink}" data-tooltip="${favName}"><span>${favName}</span></a></li>
      `);
    }
  }
};

module.exports = new HFToolBar();
