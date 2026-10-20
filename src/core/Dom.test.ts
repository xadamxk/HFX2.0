import { appendChildren, dismissButton, el, safeHttpUrl } from "./Dom";

describe("el", () => {
  it("creates an element with attributes and text children", () => {
    const a = el("a", { href: "/x", "data-tooltip": "Tip" }, ["Hello ", 5]);
    expect(a.tagName).toBe("A");
    expect(a.getAttribute("href")).toBe("/x");
    expect(a.getAttribute("data-tooltip")).toBe("Tip");
    expect(a.textContent).toBe("Hello 5");
  });

  it("handles boolean and empty attributes", () => {
    const input = el("input", {
      checked: true,
      readonly: false,
      name: null,
      value: undefined,
    });
    expect(input.hasAttribute("checked")).toBe(true);
    expect(input.getAttribute("checked")).toBe("");
    expect(input.hasAttribute("readonly")).toBe(false);
    expect(input.hasAttribute("name")).toBe(false);
    expect(input.hasAttribute("value")).toBe(false);
  });

  it("appends node children and skips null/undefined/false", () => {
    const div = el("div", null, [
      el("b", null, "bold"),
      null,
      undefined,
      false,
      "tail",
    ]);
    expect(div.innerHTML).toBe("<b>bold</b>tail");
  });

  it("never parses strings as HTML", () => {
    const payload = `<img src=x onerror="alert(1)">`;
    const div = el("div", { title: `"><script>alert(1)</script>` }, payload);
    expect(div.querySelector("img")).toBeNull();
    expect(div.querySelector("script")).toBeNull();
    expect(div.childNodes).toHaveLength(1);
    expect(div.textContent).toBe(payload);
    expect(div.getAttribute("title")).toBe(`"><script>alert(1)</script>`);
  });

  it("puts textarea content in its value without breaking out", () => {
    const payload = `</textarea><img src=x onerror="alert(1)">`;
    const textarea = el("textarea", null, payload);
    expect(textarea.value).toBe(payload);
    expect(textarea.querySelector("img")).toBeNull();
  });
});

describe("appendChildren", () => {
  it("appends a single child or a list", () => {
    const div = document.createElement("div");
    appendChildren(div, "a");
    appendChildren(div, [el("br"), "b"]);
    expect(div.innerHTML).toBe("a<br>b");
  });
});

describe("safeHttpUrl", () => {
  const base = "https://hackforums.net/index.php";

  it.each([
    "/forumdisplay.php?fid=25",
    "private.php?action=tracking",
    "https://hackforums.net/showthread.php?tid=1",
    "http://example.com",
  ])("allows %s", (url) => {
    expect(safeHttpUrl(url, base)).toBe(url);
  });

  it.each([
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "",
  ])("rejects %j", (url) => {
    expect(safeHttpUrl(url, base)).toBeNull();
  });
});

describe("dismissButton", () => {
  it("builds HF's dismiss link with the extension's icon", () => {
    const button = dismissButton("Dismiss Banner", { class: "HFXDismiss" });

    expect(button.tagName).toBe("A");
    expect(button.getAttribute("href")).toBe("javascript:void(0);");
    expect(button.title).toBe("Dismiss Banner");
    expect(button.className).toBe("HFXDismiss");
    const icon = button.querySelector("img");
    expect(icon?.getAttribute("src")).toBe(
      "chrome-extension://test-id//assets/dismiss_notice.png"
    );
    expect(icon?.alt).toBe("Dismiss");
  });
});
