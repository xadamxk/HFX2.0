import { Feature } from "../../core/Feature";
import { getPosts } from "../../core/Posts";
import Threads from "../../sections/Threads";

class PostsOnThread extends Feature {
  constructor() {
    super({
      id: "PostsOnThread",
      section: Threads,
      name: "Posts On Thread",
      enabled: true,
      description: "Filter posts on current thread by selected user.",
    });
  }

  run() {
    const posts = getPosts({ featureName: this.name });
    if (!posts.length) return;

    posts.forEach(({ el: post, authorUid: userId }, index) => {
      let threadId = 0;

      try {
        const tidInput = document.querySelector(
          'input[type="hidden"][name="tid"]'
        );
        if (tidInput)
          threadId = parseInt((tidInput as HTMLInputElement).value) || 0;
      } catch (_) {}

      const buttons = post.querySelector(".author_buttons");
      if (!buttons) return;

      const id = `HFXPostsOnThread${index}`;
      if (document.getElementById(id)) return;

      const a = document.createElement("a");
      a.id = id;
      a.className = "postbit_quote";
      a.href = `/showthread.php?tid=${threadId}&mode=single&uid=${userId}`;
      a.setAttribute("data-tooltip", "Posts on Thread");

      const span = document.createElement("span");
      const i = document.createElement("i");
      i.className = "fa fa-file-signature fa-lg";
      i.setAttribute("aria-hidden", "true");

      span.appendChild(i);
      a.appendChild(span);
      buttons.appendChild(a);
    });
  }
}

export default new PostsOnThread();
