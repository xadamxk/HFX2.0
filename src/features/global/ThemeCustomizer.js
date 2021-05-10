const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");

const ConfigurableArray = require("../../core/ConfigurableArray");
const Dropdown = require("../../configurables/Dropdown");
const Checkbox = require("../../configurables/Checkbox");
const Option = require("../../models/option.js");
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
            new Option("default", "Default"),
            new Option("cyan", "Cyan"),
            new Option("gray", "Gray"),
            new Option("magenta", "Magenta"),
            new Option("orange", "Orange"),
            new Option("orange2", "Orange2"),
            new Option("pink", "Pink"),
            new Option("pink2", "Pink2"),
            new Option("twitterBlue", "Twitter Blue"),
            new Option("rainbow", "Rainbow"),
            new Option("yellow", "Yellow")
          ]}),
        new Checkbox({ id: "tcChangeLogo", label: "Change Logo", default: true }),
        new Checkbox({ id: "tcChangeMosaic", label: "Change Mosaic", default: true }),
        new Checkbox({ id: "tcBackgroundShadow", label: "Enable Background Shadow", default: false })
      )
    });
  }

  run(settings) {
    const themeName = Util.getConfigurableValue("tcThemeName", this, settings);
    let mosaic = null;
    let logo = null;
    let accentColor = null;
    let css = "";
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
        css += ".contract_statusbar span.nav_con_active:after { background: purple !important; }";
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
      // background shadow
      if (Util.getConfigurableValue("tcBackgroundShadow", this, settings)) {
        css += "#container { background: rgb(11 5 11 / 70%) !important; }";
      }
      // accent color
      css += `.thead, .shadetabs li a.selected, .pagination .pagination_current, .quickthread_button, .nav_con_active { background: ${accentColor} !important }
        .nav_con_active span { background: none !important; }
        .logo-hide-button { color: ${accentColor} !important; }`;

      Util.addCssToPage(css);
    }
  }
}

module.exports = new ThemeCustomizer();
