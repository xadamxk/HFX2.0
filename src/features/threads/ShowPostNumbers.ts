import { Feature } from "../../core/Feature";
import { getPosts } from "../../core/Posts";
import Threads from "../../sections/Threads";

class ShowPostNumbers extends Feature {
  constructor() {
    super({
      id: "ShowPostNumbers",
      section: Threads,
      name: "Show Post Numbers",
      enabled: true,
      description: "Appends post numbers next to timestamps.",
    });
  }

  run() {
    const posts = getPosts({ featureName: this.name });
    posts.forEach(({ el: post, pid: postId }) => {
      const source = document.getElementById(`post_url_${postId}`);
      if (!source) return;

      const clone = source.cloneNode(true);
      (clone as HTMLElement).removeAttribute("style"); // remove "display: none"
      (clone as HTMLElement).style.paddingRight = "5px";

      const dateEl = post.querySelector(".post_date:not(.smalltext)");
      if (dateEl) dateEl.prepend(clone);
    });
  }
}

export default new ShowPostNumbers();
