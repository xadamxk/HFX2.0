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
        new Checkbox({ id: "tcBackgroundShadow", label: "Enable Background Shadow", default: false }),
        new Dropdown({
          id: "tcLogoImage",
          label: "Previous Logos (Default: uses theme logo)",
          default: "default",
          dropdownOptions: [
            new Option("default", "Default"),
            new Option("https://hackforums.net/images/logo/logo-hf.png", "Black Convo"),
            new Option("https://hackforums.net/images/logo/logo.10th.png", "10 Year Anniversary"),
            new Option("https://hackforums.net/images/logo/logo.gwm.png", "Goodwill Monday"),
            new Option("https://hackforums.net/images/logo/logo.hum.png", "Hackuman Release"),
            new Option("https://hackforums.net/images/logo/logo.jpg", "HF Logo (Classic)"),
            new Option("https://hackforums.net/images/logo/logo.pokemon.gif", "PokemonGo Release"),
            new Option("https://hackforums.net/images/logo/logo.420.png", "HF 420"),
            new Option("https://hackforums.net/images/logo/logo.xmas2014.gif", "Christmas (2014)"),
            new Option("https://hackforums.net/images/logo/logo.xmas2015.gif", "Christmas (2015)"),
            new Option("https://hackforums.net/images/logo/logo.xmas2017-2.png", "Christmas (2017)"),
            new Option("https://hackforums.net/images/logo/logo.xmas2019.png", "Christmas (2019)"),
            new Option("https://hackforums.net/images/logo/logo.4thJuly-3.png", "July 4th (Classic 1)"),
            new Option("https://hackforums.net/images/logo/logo.4thJuly.png", "July 4th (Classic 2)"),
            new Option("https://hackforums.net/images/logo/LOGO4TH.png", "July 4th (Modern)"),
            new Option("https://hackforums.net/images/logo/logo.easter2019.png", "Easter (2019)"),
            new Option("https://hackforums.net/images/logo/logo.halloween.png", "Halloween (Classic 1)"),
            new Option("https://hackforums.net/images/logo/logo.halloween2.png", "Halloween (Classic 2)"),
            new Option("https://hackforums.net/images/logo/logo.halloween3.gif", "Halloween (Classic 3)"),
            new Option("https://hackforums.net/images/logo/logo.halloween4.gif", "Halloween (Classic 4)"),
            new Option("https://hackforums.net/images/logo/logo.halloween5.gif", "Halloween (Classic 5)"),
            new Option("https://hackforums.net/images/logo/logo.halloween-2017.png", "Halloween (2017)"),
            new Option("https://hackforums.net/images/logo/logo.halloween2018.gif", "Halloween (2018)"),
            new Option("https://hackforums.net/images/logo/logo-Halloween-2019.gif", "Halloween (2019)"),
            new Option("https://hackforums.net/images/logo/logo.ny15.gif", "New Years (2015 1)"),
            new Option("https://hackforums.net/images/logo/logo.nye15.png", "New Years (2015 2)"),
            new Option("https://hackforums.net/images/logo/logo.newyear2016.gif", "New Years (2016 GIF)"),
            new Option("https://hackforums.net/images/logo/logo.newyear2016.png", "New Years (2016 PNG)"),
            new Option("https://hackforums.net/images/logo/logo.newyear2017.gif", "New Years (2017)"),
            new Option("https://hackforums.net/images/logo/logo.nye2018.png", "New Years (2018)"),
            new Option("https://hackforums.net/images/logo/logo.nye2019.png", "New Years (2019)"),
            new Option("https://hackforums.net/images/logo/logo.nye2020.gif", "New Years (2020 FU)"),
            new Option("https://hackforums.net/images/logo/logo.ny2020.png", "New Years (2020)"),
            new Option("https://hackforums.net/images/logo/logo.thanksgiving.gif", "Thanksgiving (Classic)"),
            new Option("https://hackforums.net/images/logo/logo.thankgiving2017.png", "Thanksgiving (2017)"),
            new Option("https://hackforums.net/images/logo/logo.thanksgiving-2018.png", "Thanksgiving (2018)"),
            new Option("https://hackforums.net/images/logo/logo.valentine.png", "Valentines Day (Classic)"),
            new Option("https://hackforums.net/images/logo/logo.valentine2018.png", "Valentines Day (2018)")
          ]})
      )
    });
  }

  run(settings) {
    let mosaic = null;
    let logo = null;
    let accentColor = null;
    let isDefaultTheme = false;
    let css = "";

    switch (settings["tcThemeName"]) {
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
      case "yellow":
        logo = Util.getURL("/assets/images/theme-customizer/logos/logo_yellow.gif");
        mosaic = Util.getURL("/assets/images/theme-customizer/mosaics/mosaic_yellow.png");
        accentColor = "#cab41b";
        break;
      default:
        isDefaultTheme = true;
    }

    // logo
    if (settings["tcChangeLogo"]) {
      const logoImage = settings["tcLogoImage"];
      // if previous HF logo
      if (logoImage !== "default") {
        $(".logo-a > img").attr("src", logoImage);
        css += ".logo-img { width: auto; height: auto; } ";
      } else {
        if (!isDefaultTheme) {
          $(".logo-a > img").attr("src", logo);
        }
      }
    }
    // mosaic
    if (settings["tcChangeMosaic"] && !isDefaultTheme) {
      $("body").css("background", `#0e0e0e url(${mosaic}) fixed`);
    }
    // background shadow
    if (settings["tcBackgroundShadow"]) {
      css += "#container { background: rgb(11 5 11 / 70%); }";
    }
    // accent color
    if (accentColor) {
      css += `.thead, .shadetabs li a.selected, .pagination .pagination_current, .quickthread_button, .nav_con_active { background: ${accentColor} }
        .nav_con_active span { background: none; }
        .logo-hide-button { color: ${accentColor}; }`;
    }
    Util.addCssToPage(css);
  }
}

module.exports = new ThemeCustomizer();
