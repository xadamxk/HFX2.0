import { Feature } from "../../core/Feature";
import Threads from "../../sections/Threads";

class InteractivePostStats extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Interactive Post Stats",
      enabled: true,
      description: "Makes post statistics clickable.",
    });
  }

  run() {
    const posts = this.querySelectorAll(".post");
    posts.forEach((post) => {
      const postbitTable = post.querySelector(".post_author");
      if (!postbitTable) return;

      const profileAnchor = postbitTable.querySelector(
        ".author_information .largetext > a"
      );
      const href = profileAnchor?.getAttribute("href") || "";
      const userId = href.split("&uid=")[1];
      if (!userId) return;

      const postId = (post.id || "").replace("post_", "");

      postbitTable.querySelectorAll(".author_row").forEach((row) => {
        const labelEl = row.querySelector(".author_label");
        const valueEl = row.querySelector(".author_value");
        if (!labelEl || !valueEl) return;

        const label = labelEl.textContent.trim().toLowerCase();
        const valueText = valueEl.textContent.trim();

        switch (label) {
          case "posts:": {
            const newDiv = document.createElement("div");
            newDiv.className = "author_value";

            const link = document.createElement("a");
            link.href = `https://hackforums.net/search.php?action=finduser&uid=${userId}`;
            link.textContent = valueText;

            newDiv.appendChild(link);
            row.replaceChild(newDiv, valueEl);
            break;
          }

          case "threads:": {
            const newDiv = document.createElement("div");
            newDiv.className = "author_value";

            const link = document.createElement("a");
            link.href = `https://hackforums.net/search.php?action=finduserthreads&uid=${userId}`;
            link.textContent = valueText;

            newDiv.appendChild(link);
            row.replaceChild(newDiv, valueEl);
            break;
          }

          case "βytes:": {
            const newDiv = document.createElement("div");
            newDiv.className = "author_value";

            const existingDonateLink = valueEl.querySelector(
              'a[onclick*="MyBB.popupWindow"]'
            );
            if (!existingDonateLink) {
              break;
            }
            const donateLink = existingDonateLink.cloneNode(
              true
            ) as HTMLAnchorElement;
            donateLink.style.paddingRight = "5px";

            const historyLink = document.createElement("a");
            historyLink.href = `https://hackforums.net/myps.php?action=history&uid=${userId}`;
            historyLink.textContent = valueText;

            newDiv.appendChild(donateLink);
            newDiv.appendChild(historyLink);

            row.replaceChild(newDiv, valueEl);
            break;
          }
        }
      });
    });
  }
}

export default new InteractivePostStats();
