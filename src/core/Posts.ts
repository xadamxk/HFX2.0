import SelectorManager from "./SelectorManager";
import { Util } from "./Util";

/** A post on a showthread.php page, with its commonly needed fields parsed. */
export interface Post {
  el: HTMLElement;
  /** Post id from `#post_<pid>`; 0 if it can't be read. */
  pid: number;
  /** Author's uid from their profile link; 0 for guests/deleted users. */
  authorUid: number;
  /** Author's username as shown on the post; "" if it can't be read. */
  authorName: string;
}

export interface GetPostsOptions {
  /** Feature name recorded with the selector error when no posts are found. */
  featureName?: string;
  /** Don't record a selector error when the page has no posts. */
  optional?: boolean;
  root?: ParentNode;
}

// Parsed per element, so every feature on the page shares one parse
const parsedPosts: WeakMap<Element, Post> = new WeakMap();

/**
 * Get every `.post` on the page, parsed once and shared across features.
 * Queries through the SelectorManager so a missing selector is recorded the
 * same way `Feature.querySelectorAll(".post")` would.
 */
export function getPosts(options: GetPostsOptions = {}): Post[] {
  const elements = SelectorManager.getInstance().queryAll<HTMLElement>(
    ".post",
    options.root,
    options.optional || false,
    options.featureName
  );
  return elements.map((element) => {
    let post = parsedPosts.get(element);
    if (!post) {
      post = parsePost(element);
      parsedPosts.set(element, post);
    }
    return post;
  });
}

function parsePost(element: HTMLElement): Post {
  const nameLink = (element.querySelector(
    ".author_information .largetext > a"
  ) ||
    element.querySelector(".author_information a")) as HTMLAnchorElement | null;
  const avatarLink = element.querySelector(
    ".author_avatar > a"
  ) as HTMLAnchorElement | null;

  return {
    el: element,
    pid: parseInt((element.id || "").replace("post_", ""), 10) || 0,
    authorUid:
      Util.getUidFromHref(nameLink?.getAttribute("href")) ||
      Util.getUidFromHref(avatarLink?.getAttribute("href")),
    authorName: (nameLink?.textContent || "").trim(),
  };
}
