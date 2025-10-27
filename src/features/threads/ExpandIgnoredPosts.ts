import { Feature } from "../../core/Feature";
import Threads from "../../sections/Threads";

class ExpandIgnoredPosts extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Expand Ignored Posts",
      enabled: false,
      description: "Automatically expand ignored users posts.",
    });
  }

  run() {
    const ignoredPosts = this.querySelectorAll(".ignored_post", document, true);
    if (!ignoredPosts.length) return;

    ignoredPosts.forEach((ignored) => {
      const ignoredId = ignored.getAttribute("id") || "";
      const postId = ignoredId.replace("ignored_post_", "");
      if (!postId) return;

      const post = document.getElementById(`post_${postId}`);
      if (post) {
        const postDate = post.querySelector(".post_date");
        if (postDate && !postDate.querySelector(".hfx-ignored-member")) {
          const badge = document.createElement("span");
          badge.className = "hfx-ignored-member";
          badge.textContent = "(IGNORED MEMBER)";
          badge.style.color = "#ff3232";
          badge.style.fontWeight = "bold";
          postDate.append(" ", badge);
        }
      }

      const thread = (window as any).Thread;
      if (thread && typeof thread.showIgnoredPost === "function") {
        thread.showIgnoredPost(Number(postId));
        return;
      }

      const showLink = document.querySelector(
        `#show_ignored_link_${postId} a`
      ) as HTMLAnchorElement | null;
      if (showLink) {
        showLink.click();
      }
    });
  }
}

export default new ExpandIgnoredPosts();
