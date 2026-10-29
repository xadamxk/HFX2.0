import {
  avatarUrl,
  embedsHidden,
  imageLink,
  parseEmbed,
  withoutEmbedLink,
  htmlToText,
  mentionsUser,
  parsePreviews,
  previewKey,
  previewText,
  renderImage,
  renderMessage,
  renderText,
  renderTrustedHtml,
} from "./formatMessage";
import type { ChatMessage } from "./ConvoClient";

const html = (node: Node) => {
  const div = document.createElement("div");
  div.appendChild(node);
  return div.innerHTML;
};

const message = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  mid: 1,
  partyId: 2,
  uid: 3,
  text: "hi",
  dateline: 0,
  ...overrides,
});

describe("renderText", () => {
  it("inserts markup as text", () => {
    const out = html(renderText('<img src=x onerror="alert(1)"><b>bold</b>'));
    expect(out).toBe(
      '&lt;img src=x onerror="alert(1)"&gt;&lt;b&gt;bold&lt;/b&gt;'
    );
  });

  it("turns newlines into <br>", () => {
    expect(html(renderText("a\nb\r\nc"))).toBe("a<br>b<br>c");
  });

  it("links http(s) URLs and leaves trailing punctuation out", () => {
    const fragment = renderText("see https://hackforums.net/x?a=1&b=2. ok");
    const link = fragment.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://hackforums.net/x?a=1&b=2");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(fragment.textContent).toBe(
      "see https://hackforums.net/x?a=1&b=2. ok"
    );
  });

  it("does not link other schemes", () => {
    const fragment = renderText("javascript:alert(1) data:text/html,x");
    expect(fragment.querySelector("a")).toBeNull();
  });

  it("does not let a URL break out of its attribute", () => {
    const fragment = renderText('https://a.test/"onmouseover="x');
    expect(fragment.querySelector("a")!.getAttribute("href")).toBe(
      "https://a.test/"
    );
    expect(fragment.querySelector("a")!.getAttribute("onmouseover")).toBeNull();
  });
});

describe("htmlToText", () => {
  it("keeps text and line breaks only", () => {
    expect(htmlToText("Hi<br><script>alert(1)</script><b>there</b>")).toBe(
      "Hi\nalert(1)there"
    );
  });
});

describe("renderImage", () => {
  it("renders allowed image types", () => {
    const img = renderImage({
      type: "PNG",
      data: "iVBO\nRw0=",
      width: 10,
      height: 5,
    })!;
    expect(img.getAttribute("src")).toBe("data:image/png;base64,iVBORw0=");
    expect(img.width).toBe(10);
  });

  it("rejects other types and non-base64 data", () => {
    expect(
      renderImage({ type: "svg+xml", data: "AAAA", width: 1, height: 1 })
    ).toBeNull();
    expect(
      renderImage({ type: "png", data: '"><script>', width: 1, height: 1 })
    ).toBeNull();
  });
});

describe("renderTrustedHtml", () => {
  const origin = "https://hackforums.net";
  const icon = `<i class='far fa-link' aria-hidden='true' style='margin-left: 3px; color: #00ff00;'></i>`;
  // A real Stanley notice from the global room (2026-10-20)
  const notice =
    `<span style='color:yellow'>&#x1F514;</span><a href='showthread.php?tid=6334366'> Looking for new Twitter accounts with Blue Check${icon}</a>` +
    ` by <a href="https://hackforums.net/member.php?action=profile&amp;uid=5787185"><span class="group2">gaincityy</span></a>${icon}</a>` +
    ` in <a href='forumdisplay.php?fid=44'>Buyers Bay${icon}</a>`;

  it("keeps a Stanley notice's thread, author and forum links", () => {
    const fragment = renderTrustedHtml(notice, origin);
    const links = Array.from(fragment.querySelectorAll("a"));
    expect(
      links.map((a) => [a.textContent!.trim(), a.getAttribute("href")])
    ).toEqual([
      [
        "Looking for new Twitter accounts with Blue Check",
        "https://hackforums.net/showthread.php?tid=6334366",
      ],
      [
        "gaincityy",
        "https://hackforums.net/member.php?action=profile&uid=5787185",
      ],
      ["Buyers Bay", "https://hackforums.net/forumdisplay.php?fid=44"],
    ]);
    links.forEach((a) => {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    });
    expect(fragment.textContent).toBe(
      "🔔 Looking for new Twitter accounts with Blue Check by gaincityy in Buyers Bay"
    );
    // The author keeps HF's username style; the icons keep only their classes
    expect(fragment.querySelector("a span")!.className).toBe("group2");
    const icons = fragment.querySelectorAll("i");
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((i) => {
      expect(i.className).toBe("far fa-link hfx-chat-icon");
      expect(i.hasAttribute("style")).toBe(false);
    });
    expect(fragment.querySelector("[style]")).toBeNull();
  });

  it("drops scripts, handlers and unsafe links", () => {
    const fragment = renderTrustedHtml(
      `<script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">click</a>` +
        `<a href="https://ok.test/" onclick="alert(4)">ok</a><b onmouseover="alert(5)">bold</b>` +
        `<span class="evil group2">x</span><i class="fa-link" onclick="x"></i><iframe src="https://evil.test"></iframe>`,
      origin
    );
    const container = document.createElement("div");
    container.appendChild(fragment);
    const out = container.innerHTML;
    expect(out).not.toMatch(
      /script|onerror|onclick|onmouseover|javascript|iframe|<img/
    );
    expect(container.textContent).toBe("clickokboldx");
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "https://ok.test/"
    );
    expect(container.querySelector("b")!.attributes).toHaveLength(0);
    expect(container.querySelector("span")).toBeNull();
  });

  it("turns non-icon <i> into emphasis", () => {
    expect(html(renderTrustedHtml("<i>hello</i>", origin))).toBe(
      "<em>hello</em>"
    );
  });
});

describe("renderMessage", () => {
  it("renders Helpbot HTML through the allowlist", () => {
    const node = renderMessage(
      message({ text: "<a href='showthread.php?tid=1'>t</a>", html: true })
    );
    expect((node as DocumentFragment).querySelector("a")!.href).toBe(
      `${location.origin}/showthread.php?tid=1`
    );
  });

  it("never treats user text as HTML", () => {
    const node = renderMessage(message({ text: "<a href='x'>t</a>" }));
    expect((node as DocumentFragment).querySelector("a")).toBeNull();
  });

  it("falls back to [Image] for bad images", () => {
    const node = renderMessage(
      message({ image: { type: "bmp", data: "AA", width: 1, height: 1 } })
    );
    expect(node.textContent).toBe("[Image]");
  });
});

describe("previewText", () => {
  it("collapses whitespace and truncates", () => {
    expect(previewText(message({ text: "a\n\n b" }))).toBe("a b");
    expect(previewText(message({ text: "x".repeat(100) }))).toHaveLength(80);
    expect(previewText(undefined)).toBe("");
  });
});

describe("avatarUrl", () => {
  const origin = "https://hackforums.net";

  it("uses HF-hosted avatars", () => {
    expect(avatarUrl("./uploads/avatars/avatar_1.gif?dateline=1", origin)).toBe(
      "https://hackforums.net/uploads/avatars/avatar_1.gif?dateline=1"
    );
    expect(avatarUrl("images/avatars/x/4_F8.png", origin)).toBe(
      "https://hackforums.net/images/avatars/x/4_F8.png"
    );
  });

  it("falls back to the default avatar", () => {
    for (const avatar of [
      "",
      "https://evil.test/a.png",
      "uploads/avatars/../../x",
      'uploads/avatars/a" x',
    ]) {
      expect(avatarUrl(avatar, origin)).toBe(
        "https://hackforums.net/images/default_avatar.png"
      );
    }
  });
});

describe("link previews", () => {
  const HF = "https://hackforums.net";
  // As the server sends a mention of G33K (convo_receivemessage extra)
  const mention = {
    text: `${HF}/member.php?action=profile&uid=1692747 no we do not`,
    extra: {
      message: `${HF}/member.php?action=profile&uid=1692747 no we do not`,
      users: { 1692747: { uid: 1692747, username: "G33K", group: 68 } },
      previews: {
        "/member.php?action=profile&uid=1692747": {
          label: "G33K",
          title: "G33K's Profile",
          group: 68,
        },
      },
    },
  };

  it("keys HF links by path and sorted query, ignoring www", () => {
    expect(previewKey(`${HF}/member.php?uid=5&action=profile`, HF)).toBe(
      "/member.php?action=profile&uid=5"
    );
    expect(previewKey("https://www.hackforums.net/x.php?a=1&a=2", HF)).toBe(
      "/x.php?a=2"
    );
    expect(previewKey("https://example.com/member.php?uid=5", HF)).toBeNull();
    expect(previewKey("https://user:pw@hackforums.net/", HF)).toBeNull();
    expect(previewKey("https://hackforums.net:8443/", HF)).toBeNull();
  });

  it("parses previews field by field", () => {
    expect(parsePreviews(undefined)).toBeUndefined();
    expect(parsePreviews({})).toEqual({});
    expect(
      parsePreviews({
        previews: {
          "/a": { label: "A", group: 2, title: "T", extra: "<b>" },
          "/b": { label: 5 },
          "/c": { label: "C", group: -1 },
          "/t": {
            label: "Thread",
            author: { uid: 9, username: "Nova", group: 46 },
          },
          "/u": { label: "U", author: { uid: 0, username: "x" } },
        },
      })
    ).toEqual({
      "/a": { label: "A", group: 2, title: "T" },
      "/c": { label: "C" },
      "/t": {
        label: "Thread",
        author: { uid: 9, username: "Nova", group: 46 },
      },
      "/u": { label: "U" },
    });
  });

  it("shows a mention as the member's name in their group style", () => {
    const node = renderText(mention.text, parsePreviews(mention.extra), HF);
    const div = document.createElement("div");
    div.appendChild(node);
    const link = div.querySelector("a")!;
    expect(link.href).toBe(`${HF}/member.php?action=profile&uid=1692747`);
    expect(link.title).toBe("G33K's Profile");
    expect(link.className).toBe("hfx-chat-preview");
    expect(link.querySelector("strong")!.className).toBe("group68");
    expect(link.querySelector("i")!.className).toBe(
      "far fa-link hfx-chat-icon"
    );
    expect(div.textContent).toBe("G33K no we do not");
  });

  it("adds a thread's author and leaves other links alone", () => {
    const text = `see ${HF}/showthread.php?tid=1, and https://example.com/a.`;
    const div = document.createElement("div");
    div.appendChild(
      renderText(
        text,
        {
          "/showthread.php?tid=1": {
            label: "A thread",
            author: { uid: 9, username: "Nova", group: 46 },
          },
        },
        HF
      )
    );
    expect(div.textContent).toBe(
      "see A thread by Nova, and https://example.com/a."
    );
    const links = div.querySelectorAll("a");
    expect(links[1].href).toBe(`${HF}/member.php?action=profile&uid=9`);
    expect(links[1].querySelector("strong")!.className).toBe("group46");
    expect(links[2].className).toBe("");
  });

  it("links 'help docs' only when the message has previews", () => {
    const withExtra = document.createElement("div");
    withExtra.appendChild(renderText("read the help docs!", {}, HF));
    expect(withExtra.querySelector("a")!.href).toBe(
      `${HF}/misc.php?action=help`
    );
    expect(withExtra.textContent).toBe("read the Help Docs!");
    const without = document.createElement("div");
    without.appendChild(renderText("read the help docs!", undefined, HF));
    expect(without.querySelector("a")).toBeNull();
  });

  it("never treats a label as HTML", () => {
    const div = document.createElement("div");
    div.appendChild(
      renderText(
        `${HF}/x.php`,
        { "/x.php": { label: "<img src=x onerror=1>" } },
        HF
      )
    );
    expect(div.querySelector("img")).toBeNull();
    expect(div.textContent).toBe("<img src=x onerror=1>");
  });

  it("renders previews from a message and uses labels in previews", () => {
    const previews = parsePreviews(mention.extra);
    expect(
      html(renderMessage(message({ text: mention.text, previews }), HF))
    ).toContain('<strong class="group68">G33K</strong>');
    expect(previewText(message({ text: mention.text, previews }), HF)).toBe(
      "G33K no we do not"
    );
  });

  it("finds mentions as profile links or @name@", () => {
    const me = { uid: 1692747, username: "G33K" };
    expect(mentionsUser(mention.text, me, HF)).toBe(true);
    expect(mentionsUser("hey @g33k@ there", me, HF)).toBe(true);
    expect(
      mentionsUser(`${HF}/member.php?action=profile&uid=16927470`, me, HF)
    ).toBe(false);
    expect(mentionsUser("hey g33k", me, HF)).toBe(false);
  });
});

describe("image link embeds", () => {
  const GIF =
    "https://static.klipy.com/ii/4493325008d34b7bf8cd6813cd5c1619/3e/aa/xxoVkhJIKEqrZBz.gif";
  // A /gif reply as the server sends it, from a poster in group 28
  const gifReply = (user: Record<string, unknown> = {}) => ({
    uid: 5,
    message: `Here's a GIF of "no ai", for https://hackforums.net/member.php?action=profile&uid=5 : ${GIF}`,
    users: {
      5: { uid: 5, username: "m0hx", usergroup: 28, displaygroup: 70, ...user },
    },
  });

  afterEach(() => {
    document.cookie = "convoStorage=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  it("finds the first https link to a jpg, gif or png, like convo.php", () => {
    expect(imageLink(`look ${GIF} and https://x.test/b.png`)).toBe(GIF);
    expect(imageLink("https://i.imgflip.com/b4edai.JPG")).toBe(
      "https://i.imgflip.com/b4edai.JPG"
    );
    expect(imageLink("https://x.test/a.gif?w=200 hi")).toBe(
      "https://x.test/a.gif?w=200"
    );
    // Not https, another type, or not a whole word
    expect(imageLink("http://x.test/a.gif")).toBeNull();
    expect(imageLink("https://x.test/a.webp")).toBeNull();
    expect(imageLink("https://x.test/a.gif.")).toBeNull();
    expect(imageLink("https://x.test/a.gif.html")).toBeNull();
    expect(imageLink("no links")).toBeNull();
  });

  it("embeds only for posters in HF's embed groups (usergroup or primary group)", () => {
    expect(parseEmbed(gifReply())).toBe(GIF);
    expect(parseEmbed(gifReply({ usergroup: 2, primary_group: 9 }))).toBe(GIF);
    for (const group of [3, 4]) {
      expect(parseEmbed(gifReply({ usergroup: group }))).toBe(GIF);
    }
    expect(parseEmbed(gifReply({ usergroup: 2 }))).toBeUndefined();
    // The display group doesn't count
    expect(
      parseEmbed(gifReply({ usergroup: 2, displaygroup: 28 }))
    ).toBeUndefined();
    expect(parseEmbed({ ...gifReply(), users: {} })).toBeUndefined();
    expect(parseEmbed({ ...gifReply(), message: "no image" })).toBeUndefined();
    expect(
      parseEmbed({ ...gifReply(), isImageDownload: true })
    ).toBeUndefined();
  });

  it("shows the image above the message text, linked to it", () => {
    const node = renderMessage({ text: gifReply().message, embed: GIF });
    const div = document.createElement("div");
    div.appendChild(node);
    const link = div.firstElementChild as HTMLAnchorElement;
    expect(link.className).toBe("hfx-chat-embed");
    expect(link.href).toBe(GIF);
    expect(link.target).toBe("_blank");
    const img = link.querySelector("img")!;
    expect(img.getAttribute("src")).toBe(GIF);
    expect(img.alt).toBe("GIF");
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(img.getAttribute("loading")).toBe("lazy");
    // The text follows, without the link the image already shows
    expect(div.textContent).toBe(
      `Here's a GIF of "no ai", for https://hackforums.net/member.php?action=profile&uid=5`
    );
    expect(div.querySelectorAll("a")).toHaveLength(2);
  });

  it("drops the shown link from the text, and a ':' left at the end", () => {
    expect(withoutEmbedLink(`for m0hx : ${GIF}`, GIF)).toBe("for m0hx");
    expect(withoutEmbedLink(`for m0hx: ${GIF}  `, GIF)).toBe("for m0hx");
    expect(withoutEmbedLink(GIF, GIF)).toBe("");
    expect(withoutEmbedLink(`${GIF}\nnice`, GIF)).toBe("nice");
    // In the middle, a colon stays and so does the line break
    expect(withoutEmbedLink(`look: ${GIF}\nnice`, GIF)).toBe("look: nice");
    expect(withoutEmbedLink(`look\n${GIF} nice`, GIF)).toBe("look\nnice");
    // Only the whole link, once
    expect(withoutEmbedLink(`${GIF}x and ${GIF}`, GIF)).toBe(`${GIF}x and`);
    expect(withoutEmbedLink("no link", GIF)).toBe("no link");
  });

  it("previews the text without the link, or the kind of image", () => {
    expect(previewText({ text: `look ${GIF}`, embed: GIF })).toBe("look");
    expect(previewText({ text: GIF, embed: GIF })).toBe("[GIF]");
    expect(
      previewText({
        text: "https://i.imgflip.com/b4edai.jpg",
        embed: "https://i.imgflip.com/b4edai.jpg",
      })
    ).toBe("[Image]");
  });

  it("drops the image when it fails to load, putting the link back in the text", () => {
    const div = document.createElement("div");
    div.appendChild(renderMessage({ text: `see ${GIF}`, embed: GIF }));
    div.querySelector("img")!.dispatchEvent(new Event("error"));
    expect(div.querySelector(".hfx-chat-embed")).toBeNull();
    expect(div.textContent).toBe(`see ${GIF}`);
  });

  it("follows /embed hide from convo.php", () => {
    expect(
      embedsHidden("a=1; convoStorage=%7B%22hideEmbeds%22%3Atrue%7D")
    ).toBe(true);
    expect(embedsHidden('convoStorage={"hideEmbeds":false}')).toBe(false);
    expect(embedsHidden("convoStorage=not json")).toBe(false);
    expect(embedsHidden("")).toBe(false);

    document.cookie = `convoStorage=${encodeURIComponent('{"hideEmbeds":true}')}`;
    const div = document.createElement("div");
    div.appendChild(renderMessage({ text: GIF, embed: GIF }));
    expect(div.querySelector("img")).toBeNull();
    expect(div.querySelector("a")!.textContent).toBe(GIF);
  });
});
