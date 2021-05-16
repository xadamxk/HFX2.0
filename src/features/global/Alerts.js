const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");
const Settings = require("../../core/Settings");
const Logger = require("../../core/Logger");
const Util = require("../../core/Util");

class Alerts extends Feature {
  constructor() {
    super({
      section: Global,
      name: "HFX Alerts",
      default: true,
      description: "Alert system for new features and changes"
    });
    this.fetchDelay = Util.isDevelopment() ? 0 : 5; // Delay (minutes) between new alert fetches
    this.now = Date.now();
    this.fetchLocation = "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/alert.json?nc=" + this.now;
  }

  run() {
    Settings.get(this, item => {
      const timePassed = item.alertsLastChecked !== undefined ? Math.floor((new Date().getTime() - item.alertsLastChecked) / (this.fetchDelay * 60 * 1000)) : this.fetchDelay;

      if (Math.floor(timePassed < this.fetchDelay)) {
        Logger.debug(`Alerts: ${timePassed} - needs ${this.fetchDelay} minutes. Skipping.`);

        if (item.currentAlert !== undefined && !item.currentAlert.hidden) {
          this.showAlert(item.currentAlert);
        }
      } else {
        $.getJSON(this.fetchLocation, fetchedAlert => {
          item.alertsLastChecked = new Date().getTime();

          if (item.currentAlert === undefined || item.currentAlert.hidden === false || item.currentAlert.AlertKey !== fetchedAlert.AlertKey) {
            fetchedAlert.hidden = false;
            item.currentAlert = fetchedAlert;
            this.showAlert(item.currentAlert);
          }

          Settings.set(this, item);
        }).fail(function() {
          Logger.error("Failed to fetch alert data.");
        });
      }
    });
  }

  showAlert(alert) {
    $("#content").prepend(`
      <div class="HFXAlert" id="HFXAlert">
        <div class="float-right" id="DismissHFXAlert">
          <a href="javascript:void(0);" title="Dismiss HFX Alert">
            <img src="${Util.getURL("/assets/images/dismiss_notice.png")}" />
          </a>
        </div>
        <div>
          <b>${alert.AlertValue}</b>
        </div>
      </div>
    `);

    $("#DismissHFXAlert").click(() => {
      $("#HFXAlert").fadeOut("slow");
      Settings.get(this, settings => {
        if (alert.AlertKey === settings.currentAlert.AlertKey) {
          settings.currentAlert.hidden = true;
          Settings.set(this, settings);
        }
      });
    });
  }
}

module.exports = new Alerts();
