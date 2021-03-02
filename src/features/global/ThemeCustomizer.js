const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");

const ConfigurableArray = require("../../core/ConfigurableArray");
const Dropdown = require("../../configurables/Dropdown");
const Checkbox = require("../../configurables/Checkbox");
const Util = require("../../core/Util");

class ThemeCustomizer extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Theme Customizer",
      default: true,
      description: "Adds additional color theme options.",
      configurables: new ConfigurableArray(
        new Dropdown({
          id: "tcThemeName",
          label: "Theme",
          default: "default",
          dropdownOptions: [
            {value: "default", label: "Default"},
            {value: "cyan", label: "Cyan"},
            {value: "gray", label: "Gray"},
            {value: "magenta", label: "Magenta"},
            {value: "orange", label: "Orange"},
            {value: "orange2", label: "Orange2"},
            {value: "pink", label: "Pink"},
            {value: "pink2", label: "Pink2"},
            {value: "twitterBlue", label: "Twitter Blue"},
            {value: "rainbow", label: "Rainbow"},
            {value: "yellow", label: "Yellow"}
          ]}),
        new Checkbox({ id: "tcChangeLogo", label: "Change Logo", default: true }),
        new Checkbox({ id: "tcChangeMosaic", label: "Change Mosaic", default: true })
      )
    });
  }

  run(settings) {
    const themeName = Util.getConfigurableValue("tcThemeName", this, settings);
    let mosaic = null;
    let logo = null;
    let accentColor = null;
    switch (themeName) {
      case "cyan":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_cyan.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_cyan.png");
        accentColor = "#2f525d";
        break;
      case "gray":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_gray.png");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_gray.png");
        accentColor = "#807e7e";
        break;
      case "magenta":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_magenta.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_magenta.png");
        accentColor = "#5d2f52";
        break;
      case "orange":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_orange.png");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_orange.png");
        accentColor = "#bd5002";
        break;
      case "orange2":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_orange.png");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_orange2.png");
        accentColor = "#803c0b";
        break;
      case "pink":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_pink.png");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_pink.png");
        accentColor = "#bd4aa7";
        break;
      case "pink2":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_pink2.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_pink2.png");
        accentColor = "#5d2f47";
        break;
      case "twitterBlue":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_cyan.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_cyan.png");
        accentColor = "#1da1f2";
        break;
      case "rainbow":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_rainbow.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_rainbow.png");
        accentColor = "linear-gradient(to right, red,orange,green,blue,purple)";
        break;
      // TODO: Make yellow less aggressive
      case "yellow":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_yellow.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_yellow.png");
        accentColor = "#cab41b";
        break;
      default:
    }

    if (mosaic && logo && accentColor) {
      // logo
      if (Util.getConfigurableValue("tcChangeLogo", this, settings)) {
        $(".logo-a > img").attr("src", logo);
      }
      // mosaic
      if (Util.getConfigurableValue("tcChangeMosaic", this, settings)) {
        $("body").css("background", `#0e0e0e url(${mosaic}) fixed`);
      }
      // accent color
      $(".thead, .shadetabs li a.selected, .pagination .pagination_current, .quickthread_button").css("background", accentColor);
      // $(".postbit_buttons > a, .postbit_buttons > .button").on("hover", function() {
      //   console.log($(this));
      //   $(this).css({"background-color": accentColor + " !important", "border-color": accentColor + " !important"});
      // });
      $(".logo-hide-button").css("color", accentColor);
    }
  }
};

module.exports = new ThemeCustomizer();
