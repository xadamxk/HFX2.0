const Feature = require("../../core/Feature");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");
const Logger = require("../../core/Logger");
const ForumDisplay = require("../../sections/ForumDisplay");

const profileSection = require("../../sections/Profile");
const threadsSection = require("../../sections/Threads");
const searchSection = new Section("/search.php");
//const usercpSection = new Section("/usercp.php");

class tBlockRevived extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "tBlock Revived",
      default: true,
      description: "Blacklists and hides unwanted threads from being shown.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      },
      additionalSections: new SectionArray(searchSection, profileSection, threadsSection, usercpSection),
      configurables: new ConfigurableArray(
        new Checkbox({ id: "tBlockConfirmPopup", label: "Confirm Blacklist Popup", default: true }),
        new Checkbox({ id: "tBlockBtnForumView", label: "Thread Blacklist Button in Sub-Forum View", default: false })//,
        //new Checkbox({ id: "tBlockTopDashLink", label: "Shortcut to Dashboard in Navbar", default: false })
      )
    });
  }

  tBlockUsers = null;
  tBlockThreads = null;
  //tBlockForums = null;

  async run(settings) {
    this.tBlockUsers = await Util.getLocalSetting(this, "tBlockUsers") || {};
    this.tBlockThreads = await Util.getLocalSetting(this, "tBlockThreads") || {};
    //this.tBlockForums = await Util.getLocalSetting(this, "tBlockForums") || {};
    Logger.debug("Blacklisted Users: " + JSON.stringify(this.tBlockUsers));
    Logger.debug("Blacklisted Threads: " + JSON.stringify(this.tBlockThreads));
    //Logger.debug("Blacklisted Forums: " + JSON.stringify(this.tBlockForums));

    if (window.location.href.includes("search.php")) {
      this.hideThreads();
    } else if (window.location.href.includes("member.php?action=profile")) {
      this.addBlacklistBtn(settings, "user");
    } else if (window.location.href.includes("forumdisplay.php")) {
      this.addBlacklistBtn(settings, "forum");
      if (Util.getConfigurableValue("tBlockBtnForumView", this, settings)) {
        this.addBlacklistInForumBtn(settings);
      }
      this.hideThreads();
    } else if (window.location.href.includes("showthread.php")) {
      this.addBlacklistBtn(settings, "thread");
    }/* else if (window.location.href.includes("usercp.php?action=tblock")) {
      this.addDashboardPage();
    } else if (window.location.href.includes("usercp.php")) {
      this.addMenuOption();
    }*/
  }

  getBlacklistTerm(type, value) {
    return (this.getBlacklistBool(type, value)) ? 'Unblacklist' : 'Blacklist';
  }

  getBlacklistBool(type, value) {
    let boolVal =  false;

    if (type === "user") {
      boolVal = (this.tBlockUsers && this.tBlockUsers.hasOwnProperty(value));
    } else if (type === "thread") {
      boolVal = (this.tBlockThreads && this.tBlockThreads.hasOwnProperty(value));
    } else if (type === "forum") {
      boolVal = (this.tBlockForums && this.tBlockForums.hasOwnProperty(value));
    }

    return boolVal;
  }

  addBlacklistBtn(settings, type) {
    if (type === "user") {
      let value = document.querySelector(`div.pro-adv-card > div > a[data-tooltip='Popularity']`).getAttribute("href").split("uid=")[1];
      let name = document.querySelector(`div.pro-adv-card > div:nth-child(2) > span > strong > span`).innerHTML;
      let blacklistTerm = this.getBlacklistTerm(type, value);

      let btnHtml = `<div><a tBlockType="${type}" tBlockValue="${value}" tBlockName="${name}" tBlockAction="${blacklistTerm}" href="javascript:void(0);" id="tBlockBlacklistBtn" title="${blacklistTerm} user"><i class="fa fa-ban" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>${blacklistTerm} User</a></div>`;

      document.querySelector(`div.pro-adv-card-dotoptions`).insertAdjacentHTML('beforeend', btnHtml);
    } else if (type === "thread") {
      let tidElement = document.querySelectorAll(`div#thread_modes_popup.popup_menu > div.popup_item_container > a.popup_item`);
      let value = tidElement[tidElement.length - 1].getAttribute("href").split("tid=")[1];
      let name = document.querySelector(`tbody > tr > td.thead > div:nth-child(2) > h1`).innerHTML;
      let blacklistTerm = this.getBlacklistTerm(type, value);

      let btnHtml = `<a tBlockType="${type}" tBlockValue="${value}" tBlockName="${name}" tBlockAction="${blacklistTerm}" href="javascript:void(0);" id="tBlockBlacklistBtn" title="${blacklistTerm} thread" rel="nofollow" ><i class="fa fa-ban oc-hf-icon fa-lg" style="margin-right: 3px;"></i></a>&nbsp;&nbsp;|&nbsp;&nbsp;`;

      document.querySelector("table.tborder.clear > tbody > tr > td.thead > div.float_right > span.smalltext > strong").insertAdjacentHTML('afterbegin', btnHtml);
    } else if (type === "forum") {
      let value = document.querySelector(`a.button.new_thread_button`).getAttribute("href").split("fid=")[1];
      let name = document.querySelector(`tbody > tr > td.thead > div:nth-child(2) > h1`).innerHTML;
      let blacklistTerm = this.getBlacklistTerm(type, value);

      let btnHtml = `<a tBlockType="${type}" tBlockValue="${value}" tBlockName="${name}" tBlockAction="${blacklistTerm}" href="javascript:void(0);" id="tBlockBlacklistBtn" title="${blacklistTerm} forum" rel="nofollow" ><i class="fa fa-ban oc-hf-icon fa-lg" style="margin-right: 3px;"></i></a>&nbsp;&nbsp;|&nbsp;&nbsp;`;

      document.querySelector(`table.tborder.clear > tbody > tr > td.thead > div.float_right > span.smalltext > strong`).insertAdjacentHTML('afterbegin', btnHtml);
    }

    var self = this;
    document.getElementById(`tBlockBlacklistBtn`).addEventListener('click', function () { self.blacklistBtnCallback(settings, this); });
  }

  addBlacklistInForumBtn(settings) {
    let threadElements = document.querySelectorAll(`tr.inline_row span[id^="tid_"]`);
    let self = this;

    threadElements.forEach(function (thread) {
      let threadParent = thread.closest(`tr`);

      let type = "thread";
      let value = thread.querySelector(`a`).getAttribute("href").split("tid=")[1];
      let name = thread.querySelector(`a`).innerHTML;
      let blacklistTerm = self.getBlacklistTerm(type, value);

      let btnHtml = `<a tBlockType="${type}" tBlockValue="${value}" tBlockName="${name}" tBlockAction="${blacklistTerm}" href="javascript:void(0);" id="tBlockBlacklistBtn-${value}" title="${blacklistTerm} thread" rel="nofollow"><small style="font-weight:400; color: #8b8b8b;"> [${blacklistTerm}]</small></a>`;

      thread.parentElement.insertAdjacentHTML('beforeend', btnHtml);

      document.getElementById(`tBlockBlacklistBtn-${value}`).addEventListener('click', function () { self.blacklistBtnCallback(settings, this); });
    });
  }

  blacklistBtnCallback(settings, element) {
    let type = element.getAttribute("tBlockType");
    let value = element.getAttribute("tBlockValue");
    let name = element.getAttribute("tBlockName");
    let action = element.getAttribute("tBlockAction");

    if (Util.getConfigurableValue("tBlockConfirmPopup", this, settings)) {
      if (!confirm(`Are you sure you want to ${action} this ${type}?`)) {
          return;
      }
    }

    if (type === "user") {
      if (action === "Blacklist") {
        this.tBlockUsers[value] = name;
      } else if (action === "Unblacklist") {
        delete this.tBlockUsers[value];
      }
      Util.saveLocalSetting(this, "tBlockUsers", this.tBlockUsers);
    } else if (type === "thread") {
      if (action === "Blacklist") {
        this.tBlockThreads[value] = name;
      } else if (action === "Unblacklist") {
        delete this.tBlockThreads[value];
      }
      Util.saveLocalSetting(this, "tBlockThreads", this.tBlockThreads);
    } else if (type === "forum") {
      if (action === "Blacklist") {
        this.tBlockForums[value] = name;
      } else if (action === "Unblacklist") {
        delete this.tBlockForums[value];
      }
      Util.saveLocalSetting(this, "tBlockForums", this.tBlockForums);
    }

    if (window.location.href.includes("forumdisplay.php") && type === "thread") {
      document.getElementById(`tBlockBlacklistBtn-${value}`).setAttribute("tBlockAction", ((action === "Blacklist") ? "Unblacklist" : "Blacklist"));
      document.getElementById(`tBlockBlacklistBtn-${value}`).querySelector(`small`).innerHTML = ` [${(action === "Blacklist") ? "Unblacklist" : "Blacklist"}]`;
    } else {
      document.getElementById(`tBlockBlacklistBtn`).setAttribute("tBlockAction", ((action === "Blacklist") ? "Unblacklist" : "Blacklist"));
    }
    
    Logger.debug(`${action}ing ${type} ${value} - ${name}`);
  }

  hideThreads() {
    if (window.location.href.includes("search.php")) {
      let threadElements = document.querySelectorAll(`tr.inline_row span > a[id^="tid_"]`);
      let self = this;

      threadElements.forEach(function (thread) {
        let threadParent = thread.closest(`tr`);
        let userValue = threadParent.querySelector(`div.author > a`).getAttribute("href").split("uid=")[1];
        let value = thread.getAttribute("href").split("tid=")[1];

        if (self.getBlacklistBool("thread", value) || self.getBlacklistBool("user", userValue)) {
          threadParent.style.display = "none";
        }
      });
    } else {
      let threadElements = document.querySelectorAll(`tr.inline_row span[id^="tid_"]`);
      let self = this;

      threadElements.forEach(function (thread) {
        let threadParent = thread.closest(`tr`);
        let userValue = threadParent.querySelector(`div.author > a`).getAttribute("href").split("uid=")[1];
        let value = thread.querySelector(`a`).getAttribute("href").split("tid=")[1];

        if (self.getBlacklistBool("thread", value) || self.getBlacklistBool("user", userValue)) {
          threadParent.style.display = "none";
        }
      });
    }
  }

  /*addMenuOption() {
    let btnHtml = `<tr><td class="trow1 smalltext"><a href="usercp.php?action=tblock" class="usercp_nav_item usercp_nav_usergroups"><i class="fas fa-ban user-cp-icon"></i>tBlock Revived</a></td></tr>`;

    document.querySelector(`tbody#usercpmisc_e`).insertAdjacentHTML('beforeend', btnHtml);
  }

  addDashboardPage () {

  }*/

};

module.exports = new tBlockRevived();
