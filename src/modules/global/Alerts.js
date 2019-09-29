require("../../_core/HFX");
class Alerts extends HFX.Feature {
  constructor () {
    super({
      section: "global",
      name: "HFX Alerts",
      default: 1,
      description: "Alert system for new features and changes",
      id: "alerts"
    });
  }

  run () {
    var showAlert = this.showAlert;
    HFX.Settings.get("global", "Alerts", "lastchecked", function(lastchecked) {
      if (lastchecked !== null) {
        var timepassed = Math.floor((new Date() - lastchecked)/60000);
        if (Math.floor(timepassed < 5)) { // below 5 minutes
          HFX.Logger.debug(`Alerts: ${timepassed} - needs 5 minutes. Skipping.`);
          HFX.Settings.get("global", "Alerts", "current_alert", function(current_alert) {
            if (!current_alert.hidden) {
              showAlert(current_alert);
            }
          });
          return false;
        }
      }

      $.getJSON("https://gist.githubusercontent.com/Anxuein/c5195ea26a67beb670e5bbc338f3349c/raw/490c353fd5c4b6b30ff486f052551e9c998b48f5/Alert.json", function(res) {
        HFX.Settings.set("global", "Alerts", "lastchecked", Number(new Date()));

        HFX.Settings.get("global", "Alerts", "current_alert", function(current_alert) {
          if (current_alert === null || current_alert.hidden === false) {
            res.hidden = false;
            HFX.Settings.set("global", "Alerts", "current_alert", res);
          }
        });
      });
    });
  }

  showAlert(alert) {
    $('#content').prepend($('<div>').addClass('HFXAlert').attr('id', 'HFXAlert')
      .append($('<div>').addClass('float_right').attr('id', 'DismissHFXAlert')
      .append($('<a>').attr('href', 'javascript:void(0);')
      .append($('<img>').attr('src', chrome.extension.getURL('/assets/images/dismiss_notice.png')).attr('title', 'Dismiss HFX Alert'))))
      .append($('<div>').append($('<b>').append(alert.AlertValue)))
    );

    $("#DismissHFXAlert").click(function() {
      $("#HFXAlert").fadeOut("slow");
      alert.hidden = true;
      HFX.Settings.set("global", "Alerts", "current_alert", alert);
    });
  }
};

module.exports = new Alerts();
