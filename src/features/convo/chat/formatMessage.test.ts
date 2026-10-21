import {
  avatarUrl,
  htmlToText,
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
