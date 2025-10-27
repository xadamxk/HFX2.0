import { Feature } from "../../core/Feature";
import Threads from "../../sections/Threads";

class PMFromPost extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "PM From Post",
      enabled: true,
      description: "Allows you to PM members from their post.",
    });
  }

  run() {
    const crumbs = document.querySelectorAll(".breadcrumb a");
    const threadTitle = (
      crumbs[crumbs.length - 1]?.textContent || ""
    ).substring(0, 50);

    this.startDynamicListeners();

    document.querySelectorAll(".post").forEach((post, index) => {
      const headHtml = document.head.innerHTML;
      const keyMatch = headHtml.match(/my_post_key = "([a-f0-9]+)"/);
      const myPostKey = keyMatch ? keyMatch[1] : "";

      const postId = (post.id || "").split("_").pop() || "";
      const postLink =
        post.querySelector(`#post_url_${postId}`)?.getAttribute("href") || "";
      const postUser = (
        post.querySelector(".author_information a")?.textContent || ""
      ).trim();

      const body = post.querySelector(".post_body");
      let postQuote = "";
      if (body) {
        const clone = body.cloneNode(true);
        (clone as HTMLElement)
          .querySelectorAll?.("blockquote")
          ?.forEach((el) => el.remove());
        (clone as HTMLElement)
          .querySelectorAll?.(".codeblock")
          ?.forEach((el) => {
            const codeText = el.querySelector("code")?.textContent || "";
            const span = document.createElement("span");
            span.textContent = `[code]\n${codeText}\n[/code]`;
            el.replaceWith(span);
          });
        postQuote = (clone.textContent || "")
          .replace(/\t+/g, "")
          .replace(/\n\s*\n/g, "\n");
      }

      postQuote = `[quote="${postUser}" pid="${postId}"]${postQuote}[/quote]`;
      postQuote = `[size=x-small]Sent from [url=${postLink}]your post[/url].[/size]\n${postQuote}\n`;

      const buttons = post.querySelector(".author_buttons");
      if (buttons) {
        const a = document.createElement("a");
        a.className = "pm-from-post-toggle postbit_quote";
        a.href = "#";
        a.id = `HFXPMFromPost${index}`;
        a.setAttribute("data-tooltip", "PM From Post");

        const span = document.createElement("span");
        const i = document.createElement("i");
        i.className = "fa fa-comment fa-lg";
        i.setAttribute("aria-hidden", "true");
        span.appendChild(i);
        a.appendChild(span);

        buttons.insertBefore(a, buttons.firstChild);
      }

      const wrapper = document.createElement("div");
      wrapper.className = "pm-from-post-container py-3";
      wrapper.innerHTML = `
        <form action="private.php" method="post" name="input" target="_blank">
          <input type="hidden" name="action" value="do_send" />
          <input type="hidden" name="pmid" value="" />
          <input type="hidden" name="do" value="" />
          <input type="hidden" name="icon" value="" />
          <input type="hidden" name="my_post_key" value="${myPostKey}" />
          <input type="hidden" name="uid" value="${postUser}" />
          <div class="text-center my-3">
            <span><strong>Notice: This is an HFX Feature!</strong></span>
          </div>
          <div class="text-center my-3">
            <div class="mb-3" style="margin-bottom: 10px;">
              <span>
                <strong>Recipients:</strong>
                <input type="text" class="textbox" name="to" value="${postUser}" readonly />
              </span>
              <span class="ml-5">
                <strong>Subject:</strong>
                <input type="text" class="textbox" name="subject" size="40" maxlength="85" value="Regarding Your Post: ${threadTitle}" />
              </span>
            </div>
            <textarea class="hfxPMFromPostInput" name="message" rows="7" cols="90">${postQuote}</textarea>
          </div>
          <div class="text-center my-3" style="margin-bottom: 10px;">
            <span><input type="checkbox" class="checkbox" name="options[signature]" value="1" checked /> Signature</span>
            -
            <span><input type="checkbox" class="checkbox" name="options[savecopy]" value="1" checked /> Save a Copy</span>
            -
            <span><input type="checkbox" class="checkbox" name="options[readreceipt]" value="1" checked /> Request Read Receipt</span>
          </div>
          <div class="text-center my-3" style="padding-bottom: 10px;">
            <input type="submit" class="button pm-from-post-button send" name="submit" value="Send Message" />
            <input type="submit" class="button pm-from-post-button" name="saveasdraft" value="Save as Draft" />
            <input type="submit" class="button pm-from-post-button" name="preview" value="Preview" />
          </div>
        </form>
      `;
      // Apply inline styles to appended elements
      (wrapper as HTMLElement).style.display = "none";
      (wrapper as HTMLElement).style.backgroundColor = "#3f3e3e";
      (wrapper as HTMLElement).style.textAlign = "center";

      const textArea = wrapper.querySelector(
        "textarea"
      ) as HTMLTextAreaElement | null;
      if (textArea) {
        textArea.style.overflow = "auto";
        textArea.style.resize = "vertical";
      }

      const checkboxes = wrapper.querySelectorAll(".checkbox");
      checkboxes.forEach((cb) => {
        const el = cb as HTMLElement;
        el.style.top = "0";
        el.style.verticalAlign = "middle";
      });

      post.appendChild(wrapper);
    });
  }

  private startDynamicListeners() {
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const toggle = target.closest(".pm-from-post-toggle");
      if (toggle) {
        e.preventDefault();
        const post = toggle.closest(".post");
        const container = post?.querySelector(".pm-from-post-container");
        if (container instanceof HTMLElement) {
          const isHidden = getComputedStyle(container).display === "none";
          container.style.display = isHidden ? "" : "none";
        }
        return;
      }

      const sendBtn = target.closest(".pm-from-post-button.send");
      if (sendBtn) {
        const container = sendBtn.closest(".pm-from-post-container");
        if (container instanceof HTMLElement) {
          container.style.display = "none";
        }
      }
    });
  }
}

export default new PMFromPost();
