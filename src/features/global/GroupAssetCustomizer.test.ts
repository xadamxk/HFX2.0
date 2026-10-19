import GroupAssetCustomizer from "./GroupAssetCustomizer";

const CUSTOM_STAR = "https://hackforums.net/images/mobale/star-78.gif";
const DEFAULT_STAR = "https://hackforums.net/images/mobale/star.gif";

const renderPost = () => {
  document.body.innerHTML = `
    <div class="post">
      <div class="author_information">
        <strong><span class="largetext"><a href="#"><span class="group78" style="color: gold">User</span></a></span></strong>
        <span class="smalltext"><img src="${CUSTOM_STAR}" /></span>
      </div>
    </div>`;
  return {
    username: document.querySelector<HTMLElement>(".largetext span")!,
    star: document.querySelector<HTMLImageElement>(".smalltext img")!,
  };
};

const settings = (overrides: object) => ({
  theme: "default",
  resizeUserbars: false,
  revertCustomStars: false,
  revertCustomGroupStyles: false,
  ...overrides,
});

describe("GroupAssetCustomizer", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/showthread.php?tid=1");
  });

  it("removes custom username styles when only that option is enabled", () => {
    const { username, star } = renderPost();

    GroupAssetCustomizer.run(settings({ revertCustomGroupStyles: true }));

    expect(username.classList.contains("group78")).toBe(false);
    expect(username.getAttribute("style")).toContain("color: #fff");
    expect(star.src).toBe(CUSTOM_STAR);
  });

  it("reverts custom stars when only that option is enabled", () => {
    const { username, star } = renderPost();

    GroupAssetCustomizer.run(settings({ revertCustomStars: true }));

    expect(star.src).toBe(DEFAULT_STAR);
    expect(username.classList.contains("group78")).toBe(true);
  });

  it("leaves posts alone when both options are off", () => {
    const { username, star } = renderPost();

    GroupAssetCustomizer.run(settings({}));

    expect(star.src).toBe(CUSTOM_STAR);
    expect(username.classList.contains("group78")).toBe(true);
  });
});
