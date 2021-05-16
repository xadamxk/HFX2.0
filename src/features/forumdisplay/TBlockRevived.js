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
// const usercpSection = new Section("/usercp.php");

class TBlockRevived extends Feature {
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
      additionalSections: new SectionArray(searchSection, profileSection, threadsSection),
      configurables: new ConfigurableArray(
        new Checkbox({ id: "tBlockConfirmPopup", label: "Confirm Blacklist Popup", default: true }),
        new Checkbox({ id: "tBlockBtnForumView", label: "Thread Blacklist Button in Sub-Forum View", default: false })//,
        // new Checkbox({ id: "tBlockTopDashLink", label: "Shortcut to Dashboard in Navbar", default: false })
      )
    });
    this.tBlockUsers = null;
    this.tBlockThreads = null;
    this.blacklistTypes = {
      "USER": "user",
      "THREAD": "thread",
      "FORUM": "forum"
    };
    this.blacklistStatus = {
      "BLACKLIST": "Blacklist",
      "UNBLACKLIST": "Unblacklist"
    };
    // this.tBlockForums = null;
  }

  async run(settings) {
    this.tBlockUsers = await Util.getLocalSetting(this, "tBlockUsers") || {};
    this.tBlockThreads = await Util.getLocalSetting(this, "tBlockThreads") || {};
    // this.tBlockForums = await Util.getLocalSetting(this, "tBlockForums") || {};
    Logger.debug("TBlockRevived Blacklisted Users: " + JSON.stringify(this.tBlockUsers));
    Logger.debug("TBlockRevived Blacklisted Threads: " + JSON.stringify(this.tBlockThreads));
    // Logger.debug("TBlockRevived Blacklisted Forums: " + JSON.stringify(this.tBlockForums));

    if (window.location.href.includes("search.php")) {
      this.hideThreads();
    } else if (window.location.href.includes("member.php?action=profile")) {
      this.addBlacklistBtn(settings, this.blacklistTypes.USER);
    } else if (window.location.href.includes("forumdisplay.php")) {
      /* this.addBlacklistBtn(settings, this.blacklistTypes.FORUM); */
      if (Util.getConfigurableValue("tBlockBtnForumView", this, settings)) {
        this.addBlacklistInForumBtn(settings);
      }
      this.hideThreads();
    } else if (window.location.href.includes("showthread.php")) {
      this.addBlacklistBtn(settings, this.blacklistTypes.THREAD);
    }
  }

  getBlacklistTerm(type, value) {
    return (this.getBlacklistStatus(type, value)) ? this.blacklistStatus.UNBLACKLIST : this.blacklistStatus.BLACKLIST;
  }

  getBlacklistStatus(type, value) {
    if (type === this.blacklistTypes.USER) {
      return (this.tBlockUsers && this.tBlockUsers.hasOwnProperty(value));
    } else if (type === this.blacklistTypes.THREAD) {
      return (this.tBlockThreads && this.tBlockThreads.hasOwnProperty(value));
    } else if (type === this.blacklistTypes.FORUM) {
      return (this.tBlockForums && this.tBlockForums.hasOwnProperty(value));
    } else {
      return false;
    }
  }

  addBlacklistBtn(settings, type) {
    if (type === this.blacklistTypes.USER) {
      const value = document.querySelector("div.pro-adv-card > div > a[data-tooltip='Popularity']").getAttribute("href").split("uid=")[1];
      const name = document.querySelector("div.pro-adv-card > div:nth-child(2) > span > strong > span").innerHTML;
      const blacklistTerm = this.getBlacklistTerm(type, value);

      const btnHtml = `<div><a tBlockType="${type}" tBlockValue="${value}" tBlockName="${name}" tBlockAction="${blacklistTerm}" href="javascript:void(0);" id="hfxtBlockBlacklistBtn" title="HFX ${blacklistTerm} user"><i class="fa fa-ban" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>${blacklistTerm} User</a></div>`;

      document.querySelector("div.pro-adv-card-dotoptions").insertAdjacentHTML("beforeend", btnHtml);
    } else if (type === this.blacklistTypes.THREAD) {
      const tidElement = document.querySelectorAll("div#thread_modes_popup.popup_menu > div.popup_item_container > a.popup_item");
      const value = tidElement[tidElement.length - 1].getAttribute("href").split("tid=")[1];
      const name = document.querySelector("tbody > tr > td.thead > div:nth-child(2) > h1").innerHTML;
      const blacklistTerm = this.getBlacklistTerm(type, value);

      const btnHtml = `<a tBlockType="${type}" tBlockValue="${value}" tBlockName="${name}" tBlockAction="${blacklistTerm}" href="javascript:void(0);" id="hfxtBlockBlacklistBtn" title="HFX: ${blacklistTerm} thread" rel="nofollow" ><i class="fa fa-ban oc-hf-icon fa-lg" style="margin-right: 3px;"></i></a>&nbsp;&nbsp;|&nbsp;&nbsp;`;

      document.querySelector("table.tborder.clear > tbody > tr > td.thead > div.float_right > span.smalltext > strong").insertAdjacentHTML("afterbegin", btnHtml);
    } else if (type === this.blacklistTypes.FORUM) {
      /* const value = document.querySelector(`a.button.new_thread_button`).getAttribute("href").split("fid=")[1];
      const name = document.querySelector(`tbody > tr > td.thead > div:nth-child(2) > h1`).innerHTML;
      const blacklistTerm = this.getBlacklistTerm(type, value);
      const btnHtml = `<a tBlockType="${type}" tBlockValue="${value}" tBlockName="${name}" tBlockAction="${blacklistTerm}" href="javascript:void(0);" id="hfxtBlockBlacklistBtn" title="${blacklistTerm} forum" rel="nofollow" ><i class="fa fa-ban oc-hf-icon fa-lg" style="margin-right: 3px;"></i></a>&nbsp;&nbsp;|&nbsp;&nbsp;`;
      document.querySelector(`table.tborder.clear > tbody > tr > td.thead > div.float_right > span.smalltext > strong`).insertAdjacentHTML('afterbegin', btnHtml); */
    }

    const self = this;
    document.getElementById("hfxtBlockBlacklistBtn").addEventListener("click", function() { self.blacklistBtnCallback(settings, this); });
  }

  addBlacklistInForumBtn(settings) {
    const threadElements = document.querySelectorAll("tr.inline_row span[id^=\"tid_\"]");
    const self = this;

    threadElements.forEach(function(thread) {
      // let threadParent = thread.closest("tr");

      const type = self.blacklistTypes.THREAD;
      const value = thread.querySelector("a").getAttribute("href").split("tid=")[1];
      const name = thread.querySelector("a").innerHTML;
      const blacklistTerm = self.getBlacklistTerm(type, value);

      const btnHtml = `<a tBlockType="${type}" tBlockValue="${value}" tBlockName="${name}" tBlockAction="${blacklistTerm}" href="javascript:void(0);" id="hfxtBlockBlacklistBtn-${value}" title="HFX: ${blacklistTerm} thread" rel="nofollow"><small style="font-weight:400; color: #8b8b8b;"> [${blacklistTerm}]</small></a>`;

      thread.parentElement.insertAdjacentHTML("beforeend", btnHtml);

      document.getElementById(`hfxtBlockBlacklistBtn-${value}`).addEventListener("click", function() { self.blacklistBtnCallback(settings, this); });
    });
  }

  blacklistBtnCallback(settings, element) {
    const type = element.getAttribute("tBlockType");
    const value = element.getAttribute("tBlockValue");
    const name = element.getAttribute("tBlockName");
    const action = element.getAttribute("tBlockAction");

    if (Util.getConfigurableValue("tBlockConfirmPopup", this, settings)) {
      if (!confirm(`Are you sure you want to ${action} this ${type}?`)) {
        return;
      }
    }

    if (type === this.blacklistTypes.USER) {
      if (action === this.blacklistStatus.BLACKLIST) {
        this.tBlockUsers[value] = name;
      } else if (action === this.blacklistStatus.UNBLACKLIST) {
        delete this.tBlockUsers[value];
      }
      Util.saveLocalSetting(this, "tBlockUsers", this.tBlockUsers);
    } else if (type === this.blacklistTypes.THREAD) {
      if (action === this.blacklistStatus.BLACKLIST) {
        this.tBlockThreads[value] = name;
      } else if (action === this.blacklistStatus.UNBLACKLIST) {
        delete this.tBlockThreads[value];
      }
      Util.saveLocalSetting(this, "tBlockThreads", this.tBlockThreads);
    } else if (type === this.blacklistTypes.FORUM) {
      /* if (action === this.blacklistStatus.BLACKLIST) {
        this.tBlockForums[value] = name;
      } else if (action === this.blacklistStatus.UNBLACKLIST) {
        delete this.tBlockForums[value];
      }
      Util.saveLocalSetting(this, "tBlockForums", this.tBlockForums); */
    }

    const blacklistStatus = ((action === this.blacklistStatus.BLACKLIST) ? this.blacklistStatus.UNBLACKLIST : this.blacklistStatus.BLACKLIST);

    if (window.location.href.includes("forumdisplay.php") && type === this.blacklistTypes.THREAD) {
      document.getElementById(`hfxtBlockBlacklistBtn-${value}`).setAttribute("tBlockAction", blacklistStatus);
      document.getElementById(`hfxtBlockBlacklistBtn-${value}`).querySelector("small").innerHTML = ` [${blacklistStatus}]`;
    } else {
      document.getElementById("hfxtBlockBlacklistBtn").setAttribute("tBlockAction", blacklistStatus);
    }

    Logger.debug(`TBlockRevived ${action}ing ${type} ${value} - ${name}`);
  }

  hideThreads() {
    if (window.location.href.includes("search.php")) {
      const threadElements = document.querySelectorAll("tr.inline_row span > a[id^=\"tid_\"]");
      let self = this;

      threadElements.forEach(function(thread) {
        let threadParent = thread.closest("tr");
        const userId = threadParent.querySelector("div.author > a").getAttribute("href").split("uid=")[1];
        const threadId = thread.getAttribute("href").split("tid=")[1];

        if (self.getBlacklistStatus(self.blacklistTypes.THREAD, threadId) || self.getBlacklistStatus(self.blacklistTypes.USER, userId)) {
          threadParent.style.display = "none";
        }
      });
    } else {
      const threadElements = document.querySelectorAll("tr.inline_row span[id^=\"tid_\"]");
      const self = this;

      threadElements.forEach(function(thread) {
        let threadParent = thread.closest("tr");
        const userId = threadParent.querySelector("div.author > a").getAttribute("href").split("uid=")[1];
        const threadId = thread.querySelector("a").getAttribute("href").split("tid=")[1];

        if (self.getBlacklistStatus(self.blacklistTypes.THREAD, threadId) || self.getBlacklistStatus(self.blacklistTypes.USER, userId)) {
          threadParent.style.display = "none";
        }
      });
    }
  }
};

module.exports = new TBlockRevived();
