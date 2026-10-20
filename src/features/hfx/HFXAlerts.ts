import { Feature } from "../../core/Feature";
import { Util } from "../../core/Util";
import { dismissButton, el } from "../../core/Dom";
import { getOrFetch } from "../../core/Remote";
import HFX from "../../sections/HFX";

enum HFXAlertsStorageKeys {
  ALERT_MAP = "alertMap",
  ALERT = "alert",
}

/** Older versions kept the last fetch time in its own storage item. */
const LEGACY_LAST_FETCH_TIME = "lastFetchTime";

interface HFXAlert {
  AlertKey: number;
  AlertValue: string;
  AlertTitle: string;
}

class HFXAlerts extends Feature {
  constructor() {
    super({
      id: "HFXAlerts",
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
        {
          id: HFXAlertsStorageKeys.ALERT,
          description: "The published alert and when it was fetched.",
          // { value: HFXAlert, fetchedAt } once fetched (see getOrFetch).
          // null means "never fetched", so the next page load fetches right away
          defaultValue: null,
        },
      ],
    });
  }
  fetchDelay: number = Util.isDevelopment() ? 0 : 5; // Delay (minutes) between new alert fetches
  now = Date.now();
  fetchLocation =
    "https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/alert.json?nc=" +
    this.now;

  async run(settings: any) {
    const alertMap = settings[`storage_${HFXAlertsStorageKeys.ALERT_MAP}`];
    if (`storage_${LEGACY_LAST_FETCH_TIME}` in settings) {
      // Replaced by the fetch time in the alert item's cache
      this.settingsService
        .removeStorageItem(this, LEGACY_LAST_FETCH_TIME)
        .catch((): void => undefined);
    }

    let publishedAlert: HFXAlert;
    try {
      // If a refetch fails, the last alert fetched is used
      publishedAlert = await getOrFetch(
        this,
        HFXAlertsStorageKeys.ALERT,
        this.fetchDelay * 60_000,
        () => this.fetchAlert(),
        this.settingsService
      );
    } catch {
      this.logger.error("Failed to fetch alert data.");
      return;
    }

    const storedKey = alertMap?.alerts?.AlertKey;
    const publishedKey = publishedAlert?.AlertKey;

    if (storedKey !== publishedKey) {
      const newAlertMap = {
        alerts: publishedAlert,
        hidden: false,
      };
      this.settingsService.setStorageItem(
        this,
        HFXAlertsStorageKeys.ALERT_MAP,
        newAlertMap
      );
      this.showAlert(publishedAlert);
    } else if (alertMap?.hidden !== true) {
      // Same alert still active; keep showing until user dismisses
      this.showAlert(alertMap?.alerts ?? publishedAlert);
    }
  }

  private async fetchAlert(): Promise<HFXAlert> {
    this.logger.debug("Fetching HFX alert data...");
    const response = await fetch(this.fetchLocation);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const fetchedAlert = (await response.json()) as HFXAlert;
    this.logger.debug("Fetched alert data:", fetchedAlert);
    return fetchedAlert;
  }

  private showAlert(fetchedAlert: HFXAlert | null | undefined) {
    // Nothing to show yet (e.g. right after "Reset cached data"), or the
    // published alert was cleared: don't render an empty alert box
    if (!fetchedAlert?.AlertTitle && !fetchedAlert?.AlertValue) return;

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
          dismissButton("Dismiss HFX Alert")
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
