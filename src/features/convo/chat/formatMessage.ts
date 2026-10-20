import { el } from "../../../core/Dom";
import type { ChatImage, ChatMessage } from "./ConvoClient";

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
export function renderMessage(message: ChatMessage): Node {
  if (message.image) {
    return renderImage(message.image) ?? document.createTextNode("[Image]");
  }
  return renderText(message.html ? htmlToText(message.text) : message.text);
}

/** One-line preview for a bubble's tooltip. */
export function previewText(message: ChatMessage | undefined): string {
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
