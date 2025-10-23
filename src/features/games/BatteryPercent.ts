import { Feature } from "../../core/Feature";
import Games from "../../sections/Games";

class BatteryPercent extends Feature {
  constructor() {
    super({
      section: Games,
      name: "Battery Percent",
      enabled: true,
      description: "Show percentage next to battery icon.",
    });
  }

  run() {
    if (!document.getElementById("game_content_currentpage")) return;

    const container = document.querySelector(".game-top-right-icons");
    if (!container) return;

    const anchors = Array.from(container.children).filter(
      (el) => el.tagName === "A"
    );
    const fifthAnchor = anchors[4];
    const batteryPercent = fifthAnchor
      ? parseInt(
          (fifthAnchor.getAttribute("title") || "").replace("%", ""),
          10
        ) || 0
      : 0;

    const icon = container.querySelector("a[data-tooltip*='Power:'] > i");
    const color = icon ? getComputedStyle(icon).color : "";
    const title = icon?.getAttribute("title") || "";
    const tooltip = icon?.getAttribute("data-tooltip") || "";

    const wrapper = document.createElement("div");

    const link = document.createElement("a");
    link.href = "gamecp.php?action=battery";
    if (title) link.setAttribute("title", title);
    if (tooltip) link.setAttribute("data-tooltip", tooltip);

    const span = document.createElement("span");
    span.id = "HFXBatteryPercent";
    span.textContent = `${batteryPercent}%`;
    span.style.color = color;
    span.style.paddingLeft = "10px";
    span.style.fontSize = "14px";
    span.style.fontWeight = "bold";

    wrapper.append(link, span);
    container.appendChild(wrapper);
  }
}

export default new BatteryPercent();
