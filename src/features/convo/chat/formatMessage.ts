import { el, safeHttpUrl } from "../../../core/Dom";
import type { ChatImage, ChatMessage } from "./ConvoClient";

/** The parts of a DM or global room message that rendering needs. */
export type RenderableMessage = Pick<ChatMessage, "text" | "image" | "html">;

/**
 * Safe rendering for Convo messages. Message text is raw user input: it is
 * only ever inserted as text nodes, with http(s) URLs turned into links and
 * newlines into <br>. This matches what HF shows (it renders with markdown-it's
 * "zero" preset, so no bold/italic).
 */

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
// Trailing punctuation is usually the sentence, not the URL
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;
const IMAGE_TYPES = ["png", "jpg", "jpeg", "gif"];
const BASE64 = /^[A-Za-z0-9+/=\s]+$/;

export const DEFAULT_AVATAR = "images/default_avatar.png";

/** Append text with newlines as <br>. */
function appendText(parent: Node, text: string): void {
  text.split(/\r\n|\r|\n/).forEach((line, index) => {
    if (index > 0) parent.appendChild(el("br"));
    if (line) parent.appendChild(document.createTextNode(line));
  });
}

/** Message text as DOM nodes: text, links, and line breaks. */
export function renderText(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    let url = match[0];
    const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? "";
    url = url.slice(0, url.length - trailing.length);
    if (!url.match(/^https?:\/\/./i)) continue;
    appendText(fragment, text.slice(last, start));
    fragment.appendChild(
      el("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, url)
    );
    last = start + url.length;
  }
  appendText(fragment, text.slice(last));
  return fragment;
}

/** Plain text of Helpbot HTML. DOMParser documents don't run scripts or load images. */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(
    html.replace(/<br\s*\/?>/gi, "\n"),
    "text/html"
  );
  return doc.body.textContent ?? "";
}

// Helpbot HTML: tags kept as-is (without attributes) and tags dropped with their content
const TRUSTED_FORMATTING = new Set(["b", "strong", "em", "u", "br"]);
const TRUSTED_DROPPED = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "template",
  "noscript",
]);
// Font Awesome icons HF draws after links, e.g. "far fa-link"
const ICON_CLASSES =
  /^(?:fa[srlbd]?|fa-[a-z0-9-]+)(?:\s+(?:fa[srlbd]?|fa-[a-z0-9-]+))*$/;

/**
 * Helpbot (Stanley) messages the server marks as trusted HTML, e.g.
 * `🔔 <a href='showthread.php?tid=1'>Title</a> by <a href=…><span class="group2">name</span></a>`.
 * Rebuilt node by node from an allowlist rather than inserted: links (http(s)
 * only, made absolute against HF), HF username styles (`groupN`), Font Awesome
 * icons and basic formatting. Every other attribute is dropped, script-like
 * elements are removed, and any other element is replaced by its contents.
 */
export function renderTrustedHtml(
  html: string,
  origin = location.origin
): DocumentFragment {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const fragment = document.createDocumentFragment();
  const copy = (from: Node, to: Node) => {
    from.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        to.appendChild(document.createTextNode(node.textContent ?? ""));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const source = node as Element;
      const tag = source.tagName.toLowerCase();
      if (TRUSTED_DROPPED.has(tag)) return;

      let target: Node | null = null;
      if (tag === "a") {
        const href = safeHttpUrl(
          source.getAttribute("href") ?? "",
          `${origin}/`
        );
        if (href) {
          target = el("a", {
            href: new URL(href, `${origin}/`).href,
            target: "_blank",
            rel: "noopener noreferrer",
          });
        }
      } else if (tag === "span") {
        const group = (source.getAttribute("class") ?? "").match(
          /^group(\d+)$/
        );
        if (group) target = el("span", { class: `group${group[1]}` });
      } else if (tag === "i") {
        const iconClass = (source.getAttribute("class") ?? "").trim();
        target = ICON_CLASSES.test(iconClass)
          ? el("i", {
              class: `${iconClass} hfx-chat-icon`,
              "aria-hidden": "true",
            })
          : el("em");
      } else if (TRUSTED_FORMATTING.has(tag)) {
        target = document.createElement(tag);
      }

      if (target) {
        copy(source, target);
        to.appendChild(target);
      } else {
        // Unknown element (or an unsafe link): keep just its contents
        copy(source, to);
      }
    });
  };
  copy(doc.body, fragment);
  return fragment;
}

/** An inline image message, or null if its type or data looks wrong. */
export function renderImage(image: ChatImage): HTMLImageElement | null {
  const type = image.type.toLowerCase();
  if (!IMAGE_TYPES.includes(type) || !BASE64.test(image.data)) return null;
  const img = el("img", {
    src: `data:image/${type};base64,${image.data.replace(/\s/g, "")}`,
    alt: "Image",
    loading: "lazy",
  });
  if (image.width > 0 && image.height > 0) {
    img.width = image.width;
    img.height = image.height;
  }
  return img;
}

/** A message's content: image, Helpbot text, or user text. */
export function renderMessage(message: RenderableMessage): Node {
  if (message.image) {
    return renderImage(message.image) ?? document.createTextNode("[Image]");
  }
  return message.html
    ? renderTrustedHtml(message.text)
    : renderText(message.text);
}

/** One-line preview for a bubble's tooltip. */
export function previewText(message: RenderableMessage | undefined): string {
  if (!message) return "";
  if (message.image) return "[Image]";
  const text = message.html ? htmlToText(message.text) : message.text;
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > 80 ? `${line.slice(0, 79)}…` : line;
}

/**
 * Absolute avatar URL. Like HF's own Convo client, only avatars uploaded to HF
 * are used; anything else falls back to the default avatar.
 */
export function avatarUrl(avatar: string, origin = location.origin): string {
  const path = (avatar || "").trim().replace(/^\.?\/+/, "");
  const allowed =
    /^(uploads\/avatars|images\/avatars)\//.test(path) &&
    !/["'<>\\\s]|\.\./.test(path);
  return `${origin}/${allowed ? path : DEFAULT_AVATAR}`;
}
