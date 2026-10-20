import { Feature } from "../../core/Feature";
import { Util } from "../../core/Util";
import { el } from "../../core/Dom";
import { getPosts } from "../../core/Posts";
import Threads from "../../sections/Threads";

class PMFromPost extends Feature {
  constructor() {
    super({
      id: "PMFromPost",
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
    const myPostKey = Util.getUserPostKey() || "";

    this.startDynamicListeners(threadTitle, myPostKey);

    getPosts({ optional: true }).forEach(({ el: post }, index) => {
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
    });
  }

  private getPostQuote(post: Element, postId: string, postUser: string) {
    const postLink =
      post.querySelector(`#post_url_${postId}`)?.getAttribute("href") || "";

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
    return `[size=x-small]Sent from [url=${postLink}]your post[/url].[/size]\n${postQuote}\n`;
  }

  private buildForm(post: Element, threadTitle: string, myPostKey: string) {
    const postId = (post.id || "").split("_").pop() || "";
    const postUser = (
      post.querySelector(".author_information a")?.textContent || ""
    ).trim();

    const hidden = (name: string, value: string) =>
      el("input", { type: "hidden", name, value });
    const checkbox = (name: string, label: string) =>
      el("span", null, [
        el("input", {
          type: "checkbox",
          class: "checkbox",
          name,
          value: "1",
          checked: true,
        }),
        ` ${label}`,
      ]);
    const submit = (name: string, value: string, extraClass = "") =>
      el("input", {
        type: "submit",
        class: `button pm-from-post-button${extraClass}`,
        name,
        value,
      });

    const textArea = el(
      "textarea",
      {
        class: "hfxPMFromPostInput",
        name: "message",
        rows: 7,
        cols: 90,
      },
      this.getPostQuote(post, postId, postUser)
    );
    textArea.style.overflow = "auto";
    textArea.style.resize = "vertical";

    const form = el(
      "form",
      { action: "private.php", method: "post", name: "input", target: "_blank" },
      [
        hidden("action", "do_send"),
        hidden("pmid", ""),
        hidden("do", ""),
        hidden("icon", ""),
        hidden("my_post_key", myPostKey),
        hidden("uid", postUser),
        el("div", { class: "text-center my-3" }, [
          el("span", null, el("strong", null, "Notice: This is an HFX Feature!")),
        ]),
        el("div", { class: "text-center my-3" }, [
          el("div", { class: "mb-3", style: "margin-bottom: 10px;" }, [
            el("span", null, [
              el("strong", null, "Recipients:"),
              " ",
              el("input", {
                type: "text",
                class: "textbox",
                name: "to",
                value: postUser,
                readonly: true,
              }),
            ]),
            " ",
            el("span", { class: "ml-5" }, [
              el("strong", null, "Subject:"),
              " ",
              el("input", {
                type: "text",
                class: "textbox",
                name: "subject",
                size: 40,
                maxlength: 85,
                value: `Regarding Your Post: ${threadTitle}`,
              }),
            ]),
          ]),
          textArea,
        ]),
        el("div", { class: "text-center my-3", style: "margin-bottom: 10px;" }, [
          checkbox("options[signature]", "Signature"),
          " - ",
          checkbox("options[savecopy]", "Save a Copy"),
          " - ",
          checkbox("options[readreceipt]", "Request Read Receipt"),
        ]),
        el("div", { class: "text-center my-3", style: "padding-bottom: 10px;" }, [
          submit("submit", "Send Message", " send"),
          " ",
          submit("saveasdraft", "Save as Draft"),
          " ",
          submit("preview", "Preview"),
        ]),
      ]
    );

    form.querySelectorAll<HTMLElement>(".checkbox").forEach((cb) => {
      cb.style.top = "0";
      cb.style.verticalAlign = "middle";
    });

    const wrapper = el("div", { class: "pm-from-post-container py-3" }, form);
    wrapper.style.backgroundColor = "#3f3e3e";
    wrapper.style.textAlign = "center";
    return wrapper;
  }

  private startDynamicListeners(threadTitle: string, myPostKey: string) {
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const toggle = target.closest(".pm-from-post-toggle");
      if (toggle) {
        e.preventDefault();
        const post = toggle.closest(".post");
        if (!post) return;
        const container = post.querySelector(".pm-from-post-container");
        if (container instanceof HTMLElement) {
          const isHidden = getComputedStyle(container).display === "none";
          container.style.display = isHidden ? "" : "none";
        } else {
          // Build the form lazily on first open
          post.appendChild(this.buildForm(post, threadTitle, myPostKey));
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
