/**
 * Safe DOM building helpers.
 *
 * HF content (thread titles, post bodies, PM subjects, usernames) is user-controlled,
 * and remote data (e.g. alert.json) is untrusted. Never interpolate either into
 * innerHTML / insertAdjacentHTML; build nodes with `el()` instead so strings are
 * always inserted as text and attribute values are never re-parsed as markup.
 */

export type ElChild = Node | string | number | null | undefined | false;
export type ElAttrs = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Create an element with attributes and children.
 * - Attribute values are set via setAttribute (never parsed as HTML).
 *   `true` sets an empty boolean attribute; `false`/`null`/`undefined` are skipped.
 * - String/number children become text nodes; `null`/`undefined`/`false` are skipped.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: ElAttrs | null,
  children?: ElChild | ElChild[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      element.setAttribute(name, value === true ? "" : String(value));
    }
  }
  appendChildren(element, children);
  return element;
}

/** Append children to a node using the same rules as `el()`. */
export function appendChildren(
  parent: Node,
  children?: ElChild | ElChild[]
): void {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(
      child instanceof Node ? child : document.createTextNode(String(child))
    );
  }
}

/**
 * Returns the URL if it is relative or uses http(s), otherwise null.
 * Rejects javascript:, data:, vbscript: and other schemes.
 */
export function safeHttpUrl(url: string, base?: string): string | null {
  const trimmed = (url || "").trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(
      trimmed,
      base ?? (typeof location !== "undefined" ? location.href : undefined)
    );
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? trimmed
      : null;
  } catch {
    return null;
  }
}
