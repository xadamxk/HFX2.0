import { Feature } from "../../core/Feature";
import ForumDisplay from "../../sections/ForumDisplay";

class HideClosedThreads extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Hide Closed Threads",
      enabled: false,
      description: "Removes all closed threads in forums.",
    });
  }

  run() {
    // Category pages list only subforums, so there may be no threads
    this.querySelectorAll(".thread_status", document, true).forEach((el) => {
      const title = el.getAttribute("title") || "";
      if (title.includes("Locked thread.")) {
        const row = el.parentElement && el.parentElement.parentElement;
        if (row) row.style.display = "none";
      }
    });
  }
}

export default new HideClosedThreads();
