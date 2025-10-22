import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import { Util } from "../../core/Util";
import HFX from "../../sections/HFX";

enum HFXAlertsStorageKeys {
  ALERT_MAP = "alertMap",
  LAST_FETCH_TIME = "lastFetchTime",
}

class HFXAlerts extends Feature {
  constructor() {
    super({
      section: HFX,
      name: "HFX Alerts",
      enabled: true,
      description: "Alert system for the new HFX related features and changes.",
      readonly: true,
      storageItems: [
        {
          id: HFXAlertsStorageKeys.ALERT_MAP,
          description: "Map of the most recent alert.",
          defaultValue: {},
        },
      ],
    });
  }
  fetchDelay: number = Util.isDevelopment() ? 0 : 5; // Delay (minutes) between new alert fetches
  now = Date.now();
  fetchLocation =
    "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/alert.json?nc=" +
    this.now;

  run(settings: any) {
    // TODO: Alert behavior is broken
    const STORAGE_KEYS = {
      ALERT_MAP: `storage_${HFXAlertsStorageKeys.ALERT_MAP}`,
      LAST_FETCH_TIME: `storage_${HFXAlertsStorageKeys.LAST_FETCH_TIME}`,
    };
    const alertMap = settings[STORAGE_KEYS.ALERT_MAP];
    const lastFetchTime = settings[STORAGE_KEYS.LAST_FETCH_TIME];
    const timePassed =
      lastFetchTime !== undefined
        ? (new Date().getTime() - lastFetchTime) / (1 * 60 * 1000)
        : Infinity;

    if (timePassed <= this.fetchDelay * 60 * 1000) {
      Logger.debug(
        `Alerts: ${timePassed} - needs ${
          this.fetchDelay * 60 * 1000
        } minutes. Skipping.`
      );
      if (alertMap !== undefined && alertMap?.hidden !== true) {
        this.showAlert(alertMap?.alerts);
      }
    } else {
      fetch(this.fetchLocation)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then((fetchedAlert) => {
          const newLastFetchTime = new Date().getTime();
          console.log(alertMap?.alerts?.AlertKey);
          console.log(fetchedAlert?.AlertKey);
          if (alertMap?.alerts?.AlertKey !== fetchedAlert?.AlertKey) {
            const newAlertMap = {
              alerts: fetchedAlert,
              hidden: false,
            };
            this.settingsService.setStorageItem(
              this,
              HFXAlertsStorageKeys.ALERT_MAP,
              newAlertMap
            );
            this.settingsService.setStorageItem(
              this,
              HFXAlertsStorageKeys.LAST_FETCH_TIME,
              newLastFetchTime
            );
            this.showAlert(fetchedAlert);
          }
        })
        .catch(() => {
          Logger.error("Failed to fetch alert data.");
        });
    }
  }

  private showAlert(fetchedAlert: any) {
    const content = document.getElementById("content");
    if (!content) return;

    content.insertAdjacentHTML(
      "afterbegin",
      `
    <div class="HFXAlert" id="HFXAlert">
      <div class="float-right" id="DismissHFXAlert">
        <a href="javascript:void(0);" title="Dismiss HFX Alert">
          <img src="${Util.getURL("/assets/dismiss_notice.png")}" />
        </a>
      </div>
      <div>
        <b>${fetchedAlert?.AlertValue}</b>
      </div>
    </div>
    `
    );

    const alertEl = document.getElementById("HFXAlert") as HTMLElement | null;
    if (alertEl) {
      alertEl.style.background = "#333333";
      alertEl.style.border = "2px solid #f4d639";
      alertEl.style.textAlign = "center";
      alertEl.style.padding = "7px 20px";
      alertEl.style.marginBottom = "15px";
      alertEl.style.fontSize = "13px";
    }

    const dismiss = document.getElementById("DismissHFXAlert");
    if (!dismiss) return;

    const self = this;
    dismiss.addEventListener("click", (e) => {
      e.preventDefault();
      this.settingsService.setStorageItem(
        self,
        HFXAlertsStorageKeys.ALERT_MAP,
        { ...fetchedAlert, hidden: true }
      );
      const alertEl = document.getElementById("HFXAlert");
      if (alertEl) {
        alertEl.style.transition = "opacity 0.4s ease";
        alertEl.style.opacity = "0";
        setTimeout(() => {
          alertEl.style.display = "none";
        }, 400);
      }
    });
  }
}

export default new HFXAlerts();
