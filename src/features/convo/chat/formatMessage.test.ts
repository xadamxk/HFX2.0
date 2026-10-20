import {
  avatarUrl,
  htmlToText,
  previewText,
  renderImage,
  renderMessage,
  renderText,
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

describe("renderMessage", () => {
  it("renders Helpbot HTML as text", () => {
    const node = renderMessage(message({ text: "<i>hello</i>", html: true }));
    expect(html(node)).toBe("hello");
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
