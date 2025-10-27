import { Feature } from "../../core/Feature";
import Threads from "../../sections/Threads";

class JoindateOnPosts extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Joindate On Posts",
      enabled: true,
      description: "Adds joindate to postbit stats.",
    });
  }

  run() {
    this.querySelectorAll(".post").forEach((post) => {
      const avatarLink = post.querySelector(".author_avatar > a");
      const joinDateData = avatarLink?.getAttribute("data-tooltip") || "";
      const joinDate = joinDateData
        ? joinDateData.replace(/^Joined\s+/, "")
        : "N/A";

      const wrapper = post.querySelector(".author_wrapper");
      if (!wrapper) return;

      const row = document.createElement("div");
      row.className = "author_row";

      const label = document.createElement("div");
      label.className = "author_label";
      label.textContent = "Join Date:";

      const value = document.createElement("div");
      value.className = "author_value";
      value.textContent = joinDate;

      row.append(label, value);
      wrapper.appendChild(row);
    });
  }
}

export default new JoindateOnPosts();
