import { Checkbox } from "../../configuration/configurables/Checkbox";
import { ColorPicker } from "../../configuration/configurables/ColorPicker";
import { Dropdown } from "../../configuration/configurables/Dropdown";
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

/**
 * // Apply the shade/shift from base -> baseLight to newColor (hex in, hex out)
function applyRelativeShade(baseHex, baseLightHex, newHex) {
  const base = hexToRgb(baseHex);
  const baseLight = hexToRgb(baseLightHex);
  const target = hexToRgb(newHex);

  const bHSL = rgbToHsl(base.r, base.g, base.b);
  const blHSL = rgbToHsl(baseLight.r, baseLight.g, baseLight.b);
  const tHSL = rgbToHsl(target.r, target.g, target.b);

  // Compute deltas (use shortest path for hue)
  const dH = shortestHueDelta(bHSL.h, blHSL.h);
  const dS = blHSL.s - bHSL.s;
  const dL = blHSL.l - bHSL.l;

  // Apply to target
  let h = wrapHue(tHSL.h + dH);
  let s = clamp01(tHSL.s + dS);
  let l = clamp01(tHSL.l + dL);

  // If both base colors are nearly gray, ignore hue delta
  if (bHSL.s < 1e-3 && blHSL.s < 1e-3) h = tHSL.h;

  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// ---------- helpers ----------
function hexToRgb(hex) {
  hex = String(hex).trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) throw new Error('Invalid hex color: ' + hex);
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  const toHex = v => Math.round(v).toString(16).padStart(2, '0');
  return '#' + toHex(clamp255(r)) + toHex(clamp255(g)) + toHex(clamp255(b));
}

function clamp255(v) { return Math.min(255, Math.max(0, v)); }
function clamp01(v) { return Math.min(1, Math.max(0, v)); }

function wrapHue(h) {
  h = h % 360;
  return h < 0 ? h + 360 : h;
}

function shortestHueDelta(from, to) {
  let d = to - from;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// RGB [0-255] -> HSL {h:[0,360), s:[0,1], l:[0,1]}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }

  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

// HSL -> RGB {r,g,b} in [0,255]
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60)       { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else              { r1 = c; g1 = 0; b1 = x; }

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255
  };
}

// 1st param is for modale blue, output is light version of 3rd param
console.log(applyRelativeShade('#2f3b5d', '#526CB1', '#cab41b'));
 */
