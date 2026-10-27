import { el, safeHttpUrl } from "../../../core/Dom";
import type { ChatImage, ChatMessage } from "./ConvoClient";

/** The parts of a DM or global room message that rendering needs. */
export type RenderableMessage = Pick<
  ChatMessage,
  "text" | "image" | "html" | "previews" | "embed"
>;

/**
 * Safe rendering for Convo messages. Message text is raw user input: it is
 * only ever inserted as text nodes, with http(s) URLs turned into links and
 * newlines into <br>. HF links the server described (extra.previews) show
 * their label instead of the URL, as HF's previews.js does.
 */

/**
 * What HF's link parser sent about an HF link in a message. Mentions arrive
 * this way: the server turns @name@ into the member's profile URL, previewed
 * as their name in their group style.
 */
export interface LinkPreview {
  label: string;
  title?: string;
  /** HF group style: `group<N>`. */
  group?: number;
  /** A thread's author, shown as "Title by author". */
  author?: { uid: number; username: string; group?: number };
}

/** Previews by previewKey of the link. */
export type LinkPreviews = Record<string, LinkPreview>;

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

/** Append text, with HF's plain-text "help docs" shortcut linked. */
function appendWithHelpDocs(parent: Node, text: string, origin: string): void {
  text.split(/(help docs)/gi).forEach((part) => {
    if (/^help docs$/i.test(part)) {
      parent.appendChild(
        previewLink(`${origin}/misc.php?action=help`, { label: "Help Docs" })
      );
    } else {
      appendText(parent, part);
    }
  });
}

const validGroup = (group: unknown): number | undefined =>
  Number.isSafeInteger(group) && (group as number) >= 0
    ? (group as number)
    : undefined;

/**
 * A message's link previews from its `extra`, checked field by field.
 * Undefined when the message has no `extra` (HF then skips its previews,
 * including the "help docs" shortcut).
 */
export function parsePreviews(extra: unknown): LinkPreviews | undefined {
  if (!extra || typeof extra !== "object") return undefined;
  const previews: LinkPreviews = {};
  const raw = (extra as { previews?: unknown }).previews;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return previews;
  for (const [key, data] of Object.entries<any>(raw)) {
    if (!data || typeof data.label !== "string") continue;
    const preview: LinkPreview = { label: data.label };
    if (typeof data.title === "string") preview.title = data.title;
    const group = validGroup(data.group);
    if (group !== undefined) preview.group = group;
    const author = data.author;
    if (
      author &&
      Number.isSafeInteger(author.uid) &&
      author.uid > 0 &&
      typeof author.username === "string"
    ) {
      preview.author = {
        uid: author.uid,
        username: author.username,
        group: validGroup(author.group),
      };
    }
    previews[key] = preview;
  }
  return previews;
}

/**
 * Usergroups whose image links convo.php shows as images (convo_1d.js
 * allowed_embed_groups), checked against the poster's usergroup and primary
 * group. HF's /gif command posts its GIF as such a link.
 */
export const EMBED_GROUPS = [3, 4, 9, 28];

const IMAGE_LINK = /^https:\/\/[^\s<>"']+\.(?:jpg|gif|png)(?:\?[^\s<>"']*)?$/i;

/** The first https link to a .jpg, .gif or .png in the text, as convo.php finds it. */
export function imageLink(text: string): string | null {
  for (const word of text.split(/\s+/)) {
    if (IMAGE_LINK.test(word) && safeHttpUrl(word)) return word;
  }
  return null;
}

/**
 * The image link to show above a raw message, when its poster (from the
 * message's users map) is in an EMBED_GROUPS group, as convo.php does.
 */
export function parseEmbed(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { message, uid, users, isImageDownload } = raw as {
    message?: unknown;
    uid?: unknown;
    users?: unknown;
    isImageDownload?: unknown;
  };
  if (typeof message !== "string" || isImageDownload) return undefined;
  const user =
    users && typeof users === "object"
      ? (users as Record<string, unknown>)[String(uid)]
      : undefined;
  if (!user || typeof user !== "object") return undefined;
  const { usergroup, primary_group } = user as {
    usergroup?: unknown;
    primary_group?: unknown;
  };
  const allowed = [usergroup, primary_group].some((group) =>
    EMBED_GROUPS.includes(Number(group))
  );
  return (allowed && imageLink(message)) || undefined;
}

/** Whether embeds are turned off on convo.php (`/embed hide`, kept in the convoStorage cookie). */
export function embedsHidden(cookie: string = document.cookie): boolean {
  const raw = cookie
    .split(/;\s*/)
    .find((part) => part.startsWith("convoStorage="))
    ?.slice("convoStorage=".length);
  if (!raw) return false;
  try {
    return JSON.parse(decodeURIComponent(raw))?.hideEmbeds === true;
  } catch {
    return false;
  }
}

/** An embedded image link, shown above the message text like convo.php does. */
function renderEmbed(url: string): HTMLElement {
  const img = el("img", {
    src: url,
    alt: /\.gif(?:\?|$)/i.test(url) ? "GIF" : "Image",
    loading: "lazy",
    referrerpolicy: "no-referrer",
  });
  const link = el(
    "a",
    {
      class: "hfx-chat-embed",
      href: url,
      target: "_blank",
      rel: "noopener noreferrer",
    },
    img
  );
  // A dead link: leave just the text, which still has the link
  img.addEventListener("error", () => link.remove());
  return link;
}

/**
 * The key HF's previews use for a link: path and sorted query of an HF URL
 * (www. ignored), e.g. "/member.php?action=profile&uid=1". Null for other sites.
 */
export function previewKey(href: string, origin: string): string | null {
  try {
    const url = new URL(href, `${origin}/`);
    const host = (name: string) => name.replace(/^www\./i, "");
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !["80", "443"].includes(url.port)) ||
      host(url.hostname) !== host(new URL(origin).hostname)
    ) {
      return null;
    }
    // Like HF: the last value of a repeated name wins
    const params = new Map<string, string>();
    url.searchParams.forEach((value, name) => params.set(name, value));
    const encode = (value: string) =>
      encodeURIComponent(value).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
      );
    const query = Array.from(params)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, value]) => `${encode(name)}=${encode(value)}`)
      .join("&");
    return url.pathname + (query ? `?${query}` : "");
  } catch {
    return null;
  }
}

function findPreview(
  previews: LinkPreviews | undefined,
  href: string,
  origin: string
): LinkPreview | undefined {
  const key = previews && previewKey(href, origin);
  return previews && key && Object.prototype.hasOwnProperty.call(previews, key)
    ? previews[key]
    : undefined;
}

/** A link shown as HF previews it: the bold label (in its group style) and a link icon. */
function previewLink(href: string, preview: LinkPreview): HTMLAnchorElement {
  return el(
    "a",
    {
      href,
      target: "_blank",
      rel: "noopener noreferrer",
      title: preview.title,
      class: "hfx-chat-preview",
    },
    [
      el(
        "strong",
        { class: preview.group !== undefined ? `group${preview.group}` : null },
        preview.label
      ),
      el("i", { class: "far fa-link hfx-chat-icon", "aria-hidden": "true" }),
    ]
  );
}

/** Split a matched URL from the sentence punctuation after it. */
function trimUrl(match: string): { url: string; trailing: string } {
  const trailing = match.match(TRAILING_PUNCTUATION)?.[0] ?? "";
  return { url: match.slice(0, match.length - trailing.length), trailing };
}

/**
 * Message text as DOM nodes: text, links, and line breaks. With previews (the
 * message's `extra`), previewed HF links show their label, and "help docs"
 * links to HF's help, as on convo.php.
 */
export function renderText(
  text: string,
  previews?: LinkPreviews,
  origin = location.origin
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const appendPlain = (part: string) =>
    previews
      ? appendWithHelpDocs(fragment, part, origin)
      : appendText(fragment, part);
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    const { url } = trimUrl(match[0]);
    if (!url.match(/^https?:\/\/./i)) continue;
    appendPlain(text.slice(last, start));
    const preview = findPreview(previews, url, origin);
    if (preview) {
      fragment.appendChild(previewLink(url, preview));
      if (preview.author) {
        const author = preview.author;
        fragment.append(
          " by ",
          previewLink(`${origin}/member.php?action=profile&uid=${author.uid}`, {
            label: author.username,
            title: `${author.username}'s Profile`,
            group: author.group,
          })
        );
      }
    } else {
      fragment.appendChild(
        el(
          "a",
          { href: url, target: "_blank", rel: "noopener noreferrer" },
          url
        )
      );
    }
    last = start + url.length;
  }
  appendPlain(text.slice(last));
  return fragment;
}

/**
 * Whether a message mentions the user: HF now sends @name@ as a link to their
 * profile; older messages still have the @name@ text.
 */
export function mentionsUser(
  text: string,
  user: { uid: number; username: string },
  origin = location.origin
): boolean {
  if (text.toLowerCase().includes(`@${user.username.toLowerCase()}@`))
    return true;
  const profile = `/member.php?action=profile&uid=${user.uid}`;
  for (const match of text.matchAll(URL_PATTERN)) {
    if (previewKey(trimUrl(match[0]).url, origin) === profile) return true;
  }
  return false;
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
export function renderMessage(
  message: RenderableMessage,
  origin = location.origin
): Node {
  if (message.image) {
    return renderImage(message.image) ?? document.createTextNode("[Image]");
  }
  if (message.html) return renderTrustedHtml(message.text, origin);
  const text = renderText(message.text, message.previews, origin);
  if (!message.embed || embedsHidden()) return text;
  const content = document.createDocumentFragment();
  content.append(renderEmbed(message.embed), text);
  return content;
}

/** One-line preview for a bubble's tooltip; previewed links show their label. */
export function previewText(
  message: RenderableMessage | undefined,
  origin = location.origin
): string {
  if (!message) return "";
  if (message.image) return "[Image]";
  let text = message.html ? htmlToText(message.text) : message.text;
  if (!message.html && message.previews) {
    text = text.replace(URL_PATTERN, (match) => {
      const { url, trailing } = trimUrl(match);
      const preview = findPreview(message.previews, url, origin);
      return preview ? preview.label + trailing : match;
    });
  }
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
