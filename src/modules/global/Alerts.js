class Alerts extends HFX.Feature {
  constructor () {
    super({
      section: HFX.Section.Global,
      name: "HFX Alerts",
      default: 1,
      description: "Alert system for new features and changes",
      id: "alerts"
    });
  }

  run () {
    var showAlert = this.showAlert;
    HFX.Settings.get("global", "Alerts", "lastchecked", (lastChecked) => {
      if (lastChecked !== null) {
        var timepassed = Math.floor((new Date() - lastChecked) / 60000);
        if (Math.floor(timepassed < 5)) { // below 5 minutes
          HFX.Logger.debug(`Alerts: ${timepassed} - needs 5 minutes. Skipping.`);
          HFX.Settings.get("global", "Alerts", "current_alert", (currentAlert) => {
            if (currentAlert !== null && !currentAlert.hidden) {
              showAlert(currentAlert);
            }
          });
          return false;
        }
      }

      $.getJSON("https://gist.githubusercontent.com/Anxuein/c5195ea26a67beb670e5bbc338f3349c/raw/490c353fd5c4b6b30ff486f052551e9c998b48f5/Alert.json", function (res) {
        HFX.Settings.update("global", "Alerts", "lastchecked", Number(new Date()));

        HFX.Settings.get("global", "Alerts", "current_alert", (currentAlert) => {
          if (currentAlert === null || currentAlert.hidden === false) {
            res.hidden = false;
            showAlert(res);
            HFX.Settings.update("global", "Alerts", "current_alert", res);
          }
        });
      });
    });
  }

  showAlert (alert) {
    $("#content").prepend($("<div>").addClass("HFXAlert").attr("id", "HFXAlert")
      .append($("<div>").addClass("float_right").attr("id", "DismissHFXAlert")
        .append($("<a>").attr("href", "javascript:void(0);")
          .append($("<img>").attr("src", chrome.extension.getURL("/assets/images/dismiss_notice.png")).attr("title", "Dismiss HFX Alert"))))
      .append($("<div>").append($("<b>").append(alert.AlertValue)))
    );

    $("#DismissHFXAlert").click(function () {
      $("#HFXAlert").fadeOut("slow");
      alert.hidden = true;
      HFX.Settings.update("global", "Alerts", "current_alert", alert);
    });
  }
};

module.exports = new Alerts();
