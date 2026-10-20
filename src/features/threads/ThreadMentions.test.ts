import ThreadMentions from "./ThreadMentions";

const post = (pid: number, uid: number) => `
  <div class="post" id="post_${pid}">
    <div class="author_information">
      <strong><span class="largetext"><a href="https://hackforums.net/member.php?action=profile&amp;uid=${uid}">user${uid}</a></span></strong>
    </div>
    <div class="post_management_buttons"></div>
  </div>`;

describe("ThreadMentions", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span class="welcome">Welcome back, <strong><a href="https://hackforums.net/member.php?action=profile&amp;uid=1">me</a></strong></span>
      ${post(10, 1)}
      ${post(11, 22)}
      <textarea id="message">Hi </textarea>`;
    ThreadMentions.run();
  });

  it("adds a mention button to other users' posts only", () => {
    expect(document.querySelector("#post_10 .hfx-user-mention")).toBeNull();
    expect(document.querySelector("#post_11 .hfx-user-mention")).not.toBeNull();
  });

  it("appends a mention tag for the post's author", () => {
    (document.querySelector("#post_11 .hfx-user-mention") as HTMLElement).click();

    expect(
      (document.getElementById("message") as HTMLTextAreaElement).value
    ).toBe("Hi [mention=22] ");
  });
});
