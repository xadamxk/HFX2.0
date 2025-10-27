import { Feature } from "../../core/Feature";
import Threads from "../../sections/Threads";

class GivePopularityButton extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Give Popularity Button",
      enabled: true,
      description:
        "Adds a button to quickly rate a user next to the popularity number.",
    });
  }

  run() {
    const reputationAnchors = this.querySelectorAll(
      "div.author_wrapper a[href*='reputation.php?uid=']"
    );
    reputationAnchors.forEach((anchor) => {
      const uid = new URL(
        anchor.getAttribute("href"),
        location.origin
      ).searchParams.get("uid");
      if (!uid) return;

      const rate = document.createElement("a");
      rate.className = "hfx-give-popularity";
      rate.href = `javascript:MyBB.reputation(${uid})`;
      rate.title = "Give Popularity";

      const icon = document.createElement("i");
      icon.className = "fa fa-plus-circle";
      icon.style.color = "#4CAF50";
      icon.setAttribute("aria-hidden", "true");

      rate.appendChild(icon);

      const parent = anchor.parentElement;
      if (parent) parent.insertBefore(rate, parent.firstChild);
    });
  }
}

export default new GivePopularityButton();
