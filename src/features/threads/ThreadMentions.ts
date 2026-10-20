import { Feature } from "../../core/Feature";
import { getPosts } from "../../core/Posts";
import { Util } from "../../core/Util";
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
    const selfUID = Util.getCurrentUser()?.uid || 0;
    const posts = getPosts({ optional: true });
    posts.forEach(({ el: post, authorUid: posterUID }, index) => {
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

  private appendMentionToInput(userId: number) {
    if (!userId) return;
    const input = document.getElementById("message") as HTMLInputElement;
    if (!input) return;
    const current = input.value || "";
    input.value = `${current}[mention=${userId}] `;
  }
}

export default new ThreadMentions();
