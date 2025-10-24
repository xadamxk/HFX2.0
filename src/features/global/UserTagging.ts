import { Feature } from "../../core/Feature";
import Global from "../../sections/Global";
import React from "react";
import { createRoot } from "react-dom/client";
import UserMentionsTextarea from "./components/UserMentionsTextarea";

class UserTagging extends Feature {
  constructor() {
    super({
      section: Global,
      name: "User Tagging",
      enabled: false,
      experimental: true,
      description:
        "Tag users in thread quick reply by searching them with @. Requires 2 characters to trigger the autocomplete.",
    });
  }

  run() {
    const textarea = this.getTextarea();
    if (!textarea) return;

    // Avoid injecting multiple times
    if (document.getElementById("hfx-user-mentions-root")) return;

    this.injectUserMentionsTextarea(textarea);
  }

  private getTextarea() {
    const path = document.location?.pathname;
    if (path.includes("/showthread.php?")) {
      return this.querySelector<HTMLTextAreaElement>(
        "#message",
        document,
        true
      );
    }
    // The sceditor breaks when we inject our own textarea, so only support quick reply for now
  }

  private injectUserMentionsTextarea(textarea: HTMLTextAreaElement) {
    // Insert React mount point after the original textarea
    const mount = document.createElement("div");
    mount.id = "hfx-user-mentions-root";
    textarea.insertAdjacentElement("afterend", mount);

    // Hide original textarea but keep it in the form for submission
    textarea.style.display = "none";

    const root = createRoot(mount);
    root.render(
      React.createElement(UserMentionsTextarea, {
        initialValue: textarea.value,
        placeholder:
          textarea.getAttribute("placeholder") ||
          "user@hackforums:~$ Tag users with @",
        minHeight: textarea.rows ? textarea.rows * 16 + 8 : 8 * 16 + 8,
        onPlainTextChange: (plain: string) => {
          textarea.value = plain;
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.dispatchEvent(new Event("change", { bubbles: true }));
        },
      })
    );
  }
}

export default new UserTagging();
