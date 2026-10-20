import { getPosts } from "./Posts";
import SelectorManager from "./SelectorManager";

const postHtml = (pid: number, uid: number, name: string) => `
  <div class="post" id="post_${pid}">
    <div class="post_author">
      <div class="author_avatar"><a href="member.php?action=profile&amp;uid=${uid}"><img></a></div>
      <div class="author_information">
        <strong><span class="largetext"><a href="https://hackforums.net/member.php?action=profile&amp;uid=${uid}"><span class="group4">${name}</span></a></span></strong>
      </div>
    </div>
  </div>`;

const featureErrors = (feature: string) =>
  SelectorManager.getInstance()
    .getErrors()
    .filter((error) => error.feature === feature).length;

describe("getPosts", () => {
  it("parses pid, author uid and author name for each post", () => {
    document.body.innerHTML = postHtml(10, 1, " Alice ") + postHtml(11, 22, "Bob");

    expect(
      getPosts().map(({ el, pid, authorUid, authorName }) => ({
        id: el.id,
        pid,
        authorUid,
        authorName,
      }))
    ).toEqual([
      { id: "post_10", pid: 10, authorUid: 1, authorName: "Alice" },
      { id: "post_11", pid: 11, authorUid: 22, authorName: "Bob" },
    ]);
  });

  it("reuses the parsed post for the same element", () => {
    document.body.innerHTML = postHtml(10, 1, "Alice");

    const [first] = getPosts();
    const [second] = getPosts();
    expect(second).toBe(first);
  });

  it("picks up posts added after an earlier call", () => {
    document.body.innerHTML = postHtml(10, 1, "Alice");
    expect(getPosts()).toHaveLength(1);

    document.body.insertAdjacentHTML("beforeend", postHtml(11, 2, "Bob"));
    expect(getPosts().map((post) => post.pid)).toEqual([10, 11]);
  });

  it("falls back to the avatar link for the uid and returns 0s when missing", () => {
    document.body.innerHTML = `
      <div class="post" id="post_5">
        <div class="author_avatar"><a href="member.php?action=profile&amp;uid=7"><img></a></div>
        <div class="author_information"><span class="largetext">Guest</span></div>
      </div>
      <div class="post" id="post_x"></div>`;

    const [withAvatar, empty] = getPosts();
    expect(withAvatar).toMatchObject({ pid: 5, authorUid: 7, authorName: "" });
    expect(empty).toMatchObject({ pid: 0, authorUid: 0, authorName: "" });
  });

  it("records a selector error for the feature when no posts are found", () => {
    document.body.innerHTML = "";

    expect(getPosts({ featureName: "Posts Test" })).toEqual([]);
    expect(featureErrors("Posts Test")).toBe(1);

    expect(getPosts({ featureName: "Optional Test", optional: true })).toEqual([]);
    expect(featureErrors("Optional Test")).toBe(0);
  });
});
