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
    this.fetchDelay = 5; // Delay (minutes) between new alert fetches
    this.fetchLocation = "https://gist.githubusercontent.com/Anxuein/c5195ea26a67beb670e5bbc338f3349c/raw/490c353fd5c4b6b30ff486f052551e9c998b48f5/Alert.json";
  }

  run() {
    Settings.get(this, (item) => {
      const timePassed = item.lastChecked !== undefined ? Math.floor((new Date().getTime() - item.lastChecked) / 60000) : this.fetchDelay;

      if (Math.floor(timePassed < this.fetchDelay)) {
        Logger.debug(`Alerts: ${timePassed} - needs ${this.fetchDelay} minutes. Skipping.`);

        if (item.currentAlert !== undefined && !item.currentAlert.hidden) {
          this.showAlert(item.currentAlert);
        }
      } else {
        $.getJSON(this.fetchLocation, (fetchedAlert) => {
          item.lastChecked = new Date().getTime();

          if (item.currentAlert === undefined || item.currentAlert.hidden === false || item.currentAlert.AlertKey !== fetchedAlert.AlertKey) {
            fetchedAlert.hidden = false;
            item.currentAlert = fetchedAlert;
            this.showAlert(item.currentAlert);
          }

          Settings.set(this, item);
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
      Settings.get(this, (settings) => {
        if (alert.AlertKey === settings.currentAlert.AlertKey) {
          settings.currentAlert.hidden = true;
          Settings.set(this, settings);
        }
      });
    });
  }
};

module.exports = new Alerts();
