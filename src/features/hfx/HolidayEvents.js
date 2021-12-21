const Feature = require("../../core/Feature");
const HFX = require("../../sections/HFX");

const ConfigurableArray = require("../../core/ConfigurableArray");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

class HolidayEvents extends Feature {
  constructor() {
    super({
      section: HFX,
      name: "Holiday Events",
      default: true,
      description: "Adds fun features based on the time of the year.",
      configurables: new ConfigurableArray(
        new Checkbox({ id: "holidayEventsChristmasLights", label: "Force enable lights", default: false })
      )
    });
  }

  run(settings) {
    var showChristmasLights = Util.getConfigurableValue("holidayEventsChristmasLights", this, settings);
    let address = location.href;
    switch (address) {
      case this.isMatch(address, "/showthread.php"):
        return "";
      default:
        return this.christmasLights(showChristmasLights);
      // console.log("HFX: New CharacterCounter page found, please report this error to a developer.");
    }
  }

  christmasLights(forceEnable) {
    // Credit: https://codepen.io/tobyj/pen/QjvEex
    const generateList = (length) => {
      let output = "<li></li>"; // Add extra entry
      for (let i = 0; i < length; i++) {
        output += "<li></li>";
      }
      return output;
    };

    $(".panel-nav-lower").each(function () {
      const width = $(this).css("width").replace("px", "");
      console.log(`Width: ${width}`);
      const lightCount = Math.floor(width / 51);
      console.log(`Count: ${lightCount}`);
      $(this).append($("<ul>").addClass("lightrope").append(generateList(lightCount)));
    });
  };

  isMatch(address, match) {
    return address.includes(match) ? address : "";
  }
};

module.exports = new HolidayEvents();
