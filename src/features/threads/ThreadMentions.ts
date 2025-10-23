import { Feature } from "../../core/Feature";
import Threads from "../../sections/Threads";

class ThreadMentions extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Thread Mentions",
      enabled: true,
      description: "Mention users with the click of a button.",
    });
  }

  run() {
    const selfUID = this.getCurrentUserId();
    document.querySelectorAll(".post").forEach((post, index) => {
      const profileLink = post.querySelector(".author_information a");
      const posterURL = profileLink?.getAttribute("href") || "";
      const posterUID = posterURL.split("?action=profile&uid=")[1] || "";
      const buttons = post.querySelector(".post_management_buttons");
      if (!buttons || !posterUID || posterUID === selfUID) return;

      const a = document.createElement("a");
      a.className = "hfx-user-mention postbit_quote";
      a.href = "#";
      a.id = `HFXUserMention${index}`;
      a.setAttribute("data-tooltip", "Mention User");

      const span = document.createElement("span");
      span.style.paddingTop = "5px";
      const i = document.createElement("i");
      i.className = "fa fa-tag fa-lg";
      i.setAttribute("aria-hidden", "true");

      span.appendChild(i);
      a.appendChild(span);
      buttons.insertBefore(a, buttons.firstChild);

      a.addEventListener("click", (e) => {
        e.preventDefault();
        this.appendMentionToInput(posterUID);
      });
    });
  }

  private appendMentionToInput(userId: string) {
    if (!userId) return;
    const input = document.getElementById("message") as HTMLInputElement;
    if (!input) return;
    const current = input.value || "";
    input.value = `${current}[mention=${userId}] `;
  }

  private getCurrentUserId(): string {
    try {
      const anchor = this.querySelector(
        ".welcome a"
      ) as HTMLAnchorElement | null;
      const href = anchor?.href || ""; // anchor.href gives absolute URL with decoded query
      if (!href) return "";

      // Fallbacks for unexpected formats
      const uid = href.split("?action=profile&uid=")[1];
      return uid;
    } catch (_) {
      return "";
    }
  }
}

export default new ThreadMentions();
