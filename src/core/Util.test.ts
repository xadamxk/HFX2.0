import { Util } from "./Util";

describe("Util.getUidFromHref", () => {
  it.each([
    ["member.php?action=profile&uid=123", 123],
    ["https://hackforums.net/member.php?action=profile&uid=45", 45],
    ["/member.php?uid=9&action=profile", 9],
    ["member.php?action=profile", 0],
    ["member.php?action=profile&uid=abc", 0],
    ["", 0],
    [null, 0],
    [undefined, 0],
  ])("reads the uid from %p", (href, expected) => {
    expect(Util.getUidFromHref(href)).toBe(expected);
  });
});

describe("Util.getCurrentUser", () => {
  it("reads the logged-in user from the welcome link", () => {
    document.body.innerHTML = `
      <span class="welcome">Welcome back, <strong><a href="https://hackforums.net/member.php?action=profile&amp;uid=574588"> xadamxk </a></strong></span>`;

    expect(Util.getCurrentUser()).toEqual({ uid: 574588, username: "xadamxk" });
  });

  it("returns null when logged out", () => {
    document.body.innerHTML = `<span class="welcome">Hello There, Guest!</span>`;

    expect(Util.getCurrentUser()).toBeNull();
  });
});
