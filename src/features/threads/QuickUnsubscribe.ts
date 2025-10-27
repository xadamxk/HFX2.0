import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import Threads from "../../sections/Threads";

class QuickUnsubscribe extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Quick Unsubscribe",
      enabled: true,
      description: "Remove all subscriptions for current thread.",
    });
  }

  run() {
    const unsubscribeElement = this.querySelector(
      ".subscription_remove",
      document,
      true
    ); // optional
    if (!unsubscribeElement) return;

    if (unsubscribeElement) {
      const headHtml = document.head.innerHTML;
      const match = headHtml.match(/my_post_key = "([a-f0-9]+)"/);
      const postKey = match ? match[1] : "";

      const anchor = unsubscribeElement.querySelector("a");
      const onclick = anchor?.getAttribute("onclick") || "";
      const threadId = onclick.replace(/\D/g, "");

      const li = document.createElement("li");

      const icon = document.createElement("i");
      icon.className = "fa fa-sign-out-alt";
      Object.assign(icon.style, {
        fontFamily: "Font Awesome 5 Pro",
        fontSize: "11px",
        right: "5px",
        position: "relative",
        fontWeight: "900",
      });
      li.appendChild(icon);

      const link = document.createElement("a");
      link.href = "javascript:void(0)";
      link.title = "HFX: Quick Unsubscribe";
      link.id = "HFXQuickUnsubscribe";
      link.textContent = "Quick Unsubscribe";
      li.appendChild(link);

      unsubscribeElement.insertAdjacentElement("afterend", li);

      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const params = new URLSearchParams();
        params.set("action", "removesubscription");
        params.set("my_post_key", postKey);
        params.set("tid", threadId);

        fetch(`${window.location.origin}/usercp2.php?ajax=1`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: params.toString(),
          credentials: "same-origin",
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            location.reload();
          })
          .catch((err) => {
            Logger.error(`Error quick unsubscribing: ${err}`);
          });
      });
    }
  }
}

export default new QuickUnsubscribe();
