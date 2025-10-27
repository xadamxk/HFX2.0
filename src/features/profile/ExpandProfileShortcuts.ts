import { Feature } from "../../core/Feature";
import Profile from "../../sections/Profile";

class ExpandProfileShortcuts extends Feature {
  constructor() {
    super({
      section: Profile,
      name: "Expand Profile Shortcuts",
      enabled: true,
      description:
        "Appends ellipsis profile shortcuts to existing shortcut header.",
    });
  }

  run() {
    const target = this.querySelector(
      ".pro-adv-container > div:nth-of-type(2) > div.float_right"
    );
    if (!target) return;

    const spacer = document.createElement("span");
    spacer.textContent = "|";
    target.appendChild(spacer);

    const options = document.querySelector(
      ".pro-adv-content-info > .pro-adv-card > div > div.pro-adv-card-dotoptions"
    );
    if (!options) return;

    Array.from(options.children).forEach((child) => {
      const iconEl = child.querySelector("i");
      const icon = iconEl ? iconEl.cloneNode(true) : null;
      if (icon && icon instanceof HTMLElement) {
        icon.removeAttribute("style");
      }

      const aEl = child.querySelector("a");
      if (!aEl) return;

      const link = aEl.getAttribute("href") || "javascript:void(0)";
      const onClick = aEl.getAttribute("onclick") || "";
      const text = child.textContent.trim();

      const a = document.createElement("a");
      a.href = link;
      a.setAttribute("data-tooltip", text);
      if (onClick) a.setAttribute("onclick", onClick);
      Object.assign(a.style, {
        display: "inline-block",
        lineHeight: "37px",
        padding: "0px 15px",
      });

      if (icon) a.appendChild(icon);
      target.appendChild(a);
    });
  }
}

export default new ExpandProfileShortcuts();
