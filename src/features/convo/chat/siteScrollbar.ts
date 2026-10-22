/**
 * HF's scrollbar colors, read from the stylesheets already on the page so the
 * dock follows the site if they change. HF has no site-wide scrollbar style:
 * its dark scrollbars (convo.php's panels and the notifications panel) share
 * colors, and the notifications stylesheet loads on every page, so the dock
 * mirrors that panel. Nothing is fetched.
 */

export interface ScrollbarColors {
  thumb: string;
  track: string;
}

/** HF's colors today, for when the rules can't be found or read. */
export const SCROLLBAR_FALLBACK: ScrollbarColors = {
  thumb: "#111",
  track: "#222",
};

const PANEL = "#notify-notifications-container";
const THUMB = `${PANEL}::-webkit-scrollbar-thumb`;
const TRACK = `${PANEL}::-webkit-scrollbar`;

/**
 * A rule's background color. HF writes `background: rgb(…)`; browsers
 * usually expand that to background-color, but if the shorthand is kept,
 * it's used when it's a plain color (not an image or gradient).
 */
function backgroundColor(style: CSSStyleDeclaration, doc: Document): string {
  const color = style.getPropertyValue("background-color");
  if (color) return color;
  const shorthand = style.getPropertyValue("background").trim();
  if (!shorthand) return "";
  const probe = doc.createElement("div").style;
  probe.color = shorthand;
  return probe.color ? shorthand : "";
}

/** The colors found on the page; a missing one wasn't found. */
export function readSiteScrollbarColors(
  doc: Document = document
): Partial<ScrollbarColors> {
  const found: Partial<ScrollbarColors> = {};
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if ("selectorText" in rule) {
        const styleRule = rule as CSSStyleRule;
        const color = backgroundColor(styleRule.style, doc);
        if (!color) continue;
        const selectors = styleRule.selectorText
          .split(",")
          .map((s) => s.trim());
        if (selectors.includes(THUMB)) found.thumb = color;
        else if (selectors.includes(TRACK)) found.track = color;
      } else if ("cssRules" in rule) {
        // @media and other group rules
        walk((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // A cross-origin sheet (fonts): its rules can't be read
      continue;
    }
    walk(rules);
  }
  return found;
}

/**
 * Set the dock's scrollbar colors (--hfx-chat-scroll-thumb/-track) to HF's.
 * The stylesheet's own values are the fallback. If the page is still loading
 * and a color is missing, it tries once more when the page has loaded.
 */
export function mirrorSiteScrollbar(
  root: HTMLElement,
  doc: Document = document
): void {
  const apply = () => {
    const colors = readSiteScrollbarColors(doc);
    if (colors.thumb)
      root.style.setProperty("--hfx-chat-scroll-thumb", colors.thumb);
    if (colors.track)
      root.style.setProperty("--hfx-chat-scroll-track", colors.track);
    return !!(colors.thumb && colors.track);
  };
  if (!apply() && doc.readyState !== "complete") {
    doc.defaultView?.addEventListener("load", apply, { once: true });
  }
}
