import { Feature } from "../../core/Feature";
import { Util } from "../../core/Util";
import { el } from "../../core/Dom";
import HFX from "../../sections/HFX";

enum HFXAlertsStorageKeys {
  ALERT_MAP = "alertMap",
  LAST_FETCH_TIME = "lastFetchTime",
}

interface HFXAlert {
  AlertKey: number;
  AlertValue: string;
  AlertTitle: string;
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
          defaultValue: { alerts: null, hidden: false },
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
    const STORAGE_KEYS = {
      ALERT_MAP: `storage_${HFXAlertsStorageKeys.ALERT_MAP}`,
      LAST_FETCH_TIME: `storage_${HFXAlertsStorageKeys.LAST_FETCH_TIME}`,
    };
    const alertMap = settings[STORAGE_KEYS.ALERT_MAP];
    const lastFetchTime = settings[STORAGE_KEYS.LAST_FETCH_TIME];
    const timePassedMinutes =
      lastFetchTime !== undefined
        ? (new Date().getTime() - lastFetchTime) / (60 * 1000)
        : Infinity;

    if (timePassedMinutes <= this.fetchDelay) {
      this.logger.debug(
        `HFX Alerts: ${timePassedMinutes} minutes passed - threshold ${this.fetchDelay} minutes. Skipping fetch.`
      );
      if (alertMap !== undefined && alertMap?.hidden !== true) {
        this.showAlert(alertMap?.alerts as HFXAlert);
      }
    } else {
      this.logger.debug("Fetching HFX alert data...");
      fetch(this.fetchLocation)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then((fetchedAlert: HFXAlert) => {
          this.logger.debug("Fetched alert data:", fetchedAlert);
          const newLastFetchTime = new Date().getTime();
          // Always update the last fetch time on successful fetch
          this.settingsService.setStorageItem(
            this,
            HFXAlertsStorageKeys.LAST_FETCH_TIME,
            newLastFetchTime
          );

          const storedKey = alertMap?.alerts?.AlertKey;
          const fetchedKey = fetchedAlert?.AlertKey;

          if (storedKey !== fetchedKey) {
            const newAlertMap = {
              alerts: fetchedAlert,
              hidden: false,
            };
            this.settingsService.setStorageItem(
              this,
              HFXAlertsStorageKeys.ALERT_MAP,
              newAlertMap
            );
            this.showAlert(fetchedAlert);
          } else if (alertMap?.hidden !== true) {
            // Same alert still active; keep showing until user dismisses
            this.showAlert(alertMap?.alerts ?? fetchedAlert);
          }
        })
        .catch(() => {
          this.logger.error("Failed to fetch alert data.");
        });
    }
  }

  private showAlert(fetchedAlert: HFXAlert) {
    const content = document.getElementById("content");
    if (!content) return;

    // Alert text is remote data: render it as text. `<br>` is the only markup
    // honored, and it is turned into real line breaks rather than parsed.
    const valueChildren: (string | HTMLElement)[] = [];
    String(fetchedAlert?.AlertValue || "")
      .split(/<br\s*\/?>/i)
      .forEach((line, i) => {
        if (i > 0) valueChildren.push(el("br"));
        valueChildren.push(line);
      });

    content.prepend(
      el("div", { class: "HFXAlert", id: "HFXAlert" }, [
        el(
          "div",
          { class: "float-right", id: "DismissHFXAlert" },
          el(
            "a",
            { href: "javascript:void(0);", title: "Dismiss HFX Alert" },
            el("img", { src: Util.getURL("/assets/dismiss_notice.png") })
          )
        ),
        el("div", null, [
          el("div", null, el("b", null, String(fetchedAlert?.AlertTitle || ""))),
          el("div", null, valueChildren),
        ]),
      ])
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
        { alerts: fetchedAlert, hidden: true }
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
