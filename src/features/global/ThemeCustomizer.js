const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");

const ConfigurableArray = require("../../core/ConfigurableArray");
const Dropdown = require("../../configurables/Dropdown");
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
            {value: "magenta", label: "Magenta"},
            {value: "pink", label: "Pink"},
            {value: "pink2", label: "Pink2"},
            {value: "rainbow", label: "Rainbow"},
            {value: "yellow", label: "Yellow"}
          ]})
      )
    });
  }

  run(settings) {
    const themeName = Util.getConfigurableValue("tcThemeName", this, settings);
    let mosaic = null;
    let logo = null;
    let accentColor = null;
    // TODO: Find better mosaics
    switch (themeName) {
      case "cyan":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_cyan.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_cyan.png");
        accentColor = "#2f525d";
        break;
      case "magenta":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_magenta.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_magenta.png");
        accentColor = "#5d2f52";
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
      case "rainbow":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_rainbow.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_rainbow.png");
        accentColor = "linear-gradient(to right, red,orange,green,blue,purple)";
        break;
      case "yellow":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_yellow.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_yellow.png");
        accentColor = "#ffe14d";
        break;
      default:
    }

    if (mosaic && logo && accentColor) {
      // logo
      $(".logo-a > img").attr("src", logo);
      // mosaic
      $("body").css("background", `#0e0e0e url(${mosaic}) fixed`);
      // accent color
      $(".thead, .shadetabs li a.selected, .pagination .pagination_current, .quickthread_button").css("background", accentColor);
      $(".logo-hide-button").css("color", accentColor);
    }
  }
};

module.exports = new ThemeCustomizer();
