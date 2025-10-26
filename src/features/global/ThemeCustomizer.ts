import { Checkbox } from "../../configuration/configurables/Checkbox";
import { ColorPicker } from "../../configuration/configurables/ColorPicker";
import { Dropdown } from "../../configuration/configurables/Dropdown";
import { Configurable } from "../../core/Configurable";
import { Feature } from "../../core/Feature";
import { Util } from "../../core/Util";
import Global from "../../sections/Global";

enum THEMES {
  DEFAULT = "default",
  CUSTOM = "custom",
  MOBILE_BLUE = "mobale_blue",
  CYAN = "cyan",
  GRAY = "gray",
  MAGENTA = "magenta",
  ORANGE = "orange",
  ORANGE_DARK = "orange_dark",
  PINK = "pink",
  PINK_DARK = "pink_dark",
  X_BLUE = "x_blue",
  YELLOW = "yellow",
}

class ThemeCustomizer extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Theme Customizer",
      enabled: false,
      description:
        "Allows theme customization to the background, logo, accent color, and other elements.",
      configurables: [
        new Checkbox({
          id: "removeBackGroundOpacity",
          label: "Remove Background Opacity",
          description: "Remove the opacity from the background.",
          default: true,
        }),
        new Checkbox({
          id: "removeStyledCursor",
          label: "Remove Styled Cursor",
          description: "Sets the cursor to the default browser cursor.",
          default: true,
        }),
        new Dropdown({
          id: "theme",
          label: "Theme",
          description: "Change the site's theme to a preset or custom color.",
          options: [
            { label: "Default", value: THEMES.DEFAULT },
            { label: "Custom", value: THEMES.CUSTOM },
            { label: "Mobile Blue", value: THEMES.MOBILE_BLUE },
            { label: "Cyan", value: THEMES.CYAN },
            { label: "Gray", value: THEMES.GRAY },
            { label: "Magenta", value: THEMES.MAGENTA },
            { label: "Orange", value: THEMES.ORANGE },
            { label: "Orange (Dark)", value: THEMES.ORANGE_DARK },
            { label: "Pink", value: THEMES.PINK },
            { label: "Pink (Dark)", value: THEMES.PINK_DARK },
            { label: "X/Twitter Blue", value: THEMES.X_BLUE },
            { label: "Yellow", value: THEMES.YELLOW },
          ],
          default: THEMES.DEFAULT,
        }),
        new ColorPicker({
          id: "customPrimaryColor",
          label: "Custom Theme Color",
          description:
            "The primary color to use for the Custom theme (Requires Theme to be set to Custom).",
          default: "#2f3b5d",
        }),
      ],
    });
  }

  run(settings: any) {
    const removeBackGroundOpacity = settings.removeBackGroundOpacity;
    if (removeBackGroundOpacity) {
      document.head.appendChild(document.createElement("style")).textContent =
        ".wrapper-content { opacity: unset !important; }";
    }

    const removeStyledCursor = settings.removeStyledCursor;
    if (removeStyledCursor) {
      document.head.appendChild(
        document.createElement("style")
      ).textContent = `body { cursor: default !important; }
        [data-tooltip] { cursor: pointer !important; }
        `;
    }

    const theme = settings.theme;
    let primaryColor = "";
    let primaryLightColor = "";
    let css = "";

    switch (theme) {
      case THEMES.DEFAULT:
        return;
      case THEMES.CUSTOM: {
        primaryColor = settings.customPrimaryColor;
        primaryLightColor = settings.customPrimaryColor;
        break;
      }
      case THEMES.MOBILE_BLUE: {
        primaryColor = "#2f3b5d";
        primaryLightColor = "#526CB1";
        break;
      }
      case THEMES.CYAN: {
        primaryColor = "#2f525d";
        primaryLightColor = "#529cb1";
        break;
      }
      case THEMES.GRAY: {
        primaryColor = "#807e7e";
        primaryLightColor = "#beb7b7";
        break;
      }
      case THEMES.MAGENTA: {
        primaryColor = "#5d2f52";
        primaryLightColor = "#ca5c8d";
        break;
      }
      case THEMES.ORANGE: {
        primaryColor = "#bd5002";
        primaryLightColor = "#ff8837";
        break;
      }
      case THEMES.ORANGE_DARK: {
        primaryColor = "#80522f";
        primaryLightColor = "#ca8a5c";
        break;
      }
      case THEMES.PINK: {
        primaryColor = "#bd4aa7";
        primaryLightColor = "#e09ed4";
        break;
      }
      case THEMES.PINK_DARK: {
        primaryColor = "#5d2f47";
        primaryLightColor = "#b15285";
        break;
      }
      case THEMES.X_BLUE: {
        primaryColor = "#1da1f2";
        primaryLightColor = "#8bd2fb";
        break;
      }
      case THEMES.YELLOW: {
        primaryColor = "#cab41b";
        primaryLightColor = "#f0de6c";
        break;
      }
    }
    if (primaryColor && primaryLightColor) {
      css += `.thead, .shadetabs li a.selected, .pagination .pagination_current, .quickthread_button, .nav_con_active { background: ${primaryColor} }
        .nav_con_active span { background: none; }
        .oc-time { color: ${primaryLightColor}; }
        .logo-hide-button { color: ${primaryColor}; }
        hr { background: linear-gradient(to right, ${primaryColor}, ${primaryLightColor}, ${primaryColor}) !important; }
        .signature { border-top: 1px dashed ${primaryLightColor} !important; }
        `;
    }
    if (css) {
      Util.addCssToPage(css);
    }
  }
}

export default new ThemeCustomizer();
