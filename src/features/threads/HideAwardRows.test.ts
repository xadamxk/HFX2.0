import HideAwardRows from "./HideAwardRows";

const renderPost = (awardClasses: string[]) => `
  <div class="post_myawards"><span>${awardClasses
    .map((cls) => `<i class="award_sprite ${cls}"></i>`)
    .join("")}</span></div>`;

const visibleCount = (post: Element) =>
  Array.from(post.querySelectorAll<HTMLElement>("i.award_sprite")).filter(
    (award) => award.style.display !== "none"
  ).length;

describe("HideAwardRows", () => {
  it("doesn't carry a wide award's offset over to later posts", () => {
    const sevenAwards = Array(7).fill("award_1");
    document.body.innerHTML =
      renderPost(["award_2", ...Array(6).fill("award_1")]) +
      renderPost(sevenAwards);

    HideAwardRows.run({ maxRows: 1 });

    const [first, second] = Array.from(
      document.querySelectorAll(".post_myawards")
    );
    // award_2 takes extra room, so the first post fits fewer awards in a row
    expect(visibleCount(first)).toBe(4);
    // The second post has no wide awards, so a full row of 6 shows
    expect(visibleCount(second)).toBe(6);
  });

  it("hides every award when rows is 0", () => {
    document.body.innerHTML = renderPost(["award_1", "award_1"]);

    HideAwardRows.run({ maxRows: 0 });

    expect(visibleCount(document.querySelector(".post_myawards")!)).toBe(0);
  });
});
