import HideHeaderBanners from "./HideHeaderBanners";
import SelectorManager from "../../core/SelectorManager";

describe("HideHeaderBanners", () => {
  it("removes the ad ticker when it is present", async () => {
    document.body.innerHTML = `<div class="hf-ad-ticker"></div>`;

    await HideHeaderBanners.run({
      hideAdTicker: true,
      hideGlobalBanners: false,
    });

    expect(document.querySelector(".hf-ad-ticker")).toBeNull();
  });

  it("does not report a selector error on pages without the ticker or banners", async () => {
    document.body.innerHTML = `<div id="content"></div>`;
    const errorsBefore = SelectorManager.getInstance().getErrors().length;

    await HideHeaderBanners.run({
      hideAdTicker: true,
      hideGlobalBanners: true,
    });

    expect(SelectorManager.getInstance().getErrors()).toHaveLength(errorsBefore);
  });

  const anchorBannerPage = `
    <div id="content"><div class="wrapper-content">
      <style>#hf-holiday-announcement { display: block; }</style>
      <a id="hf-holiday-announcement" href="/showthread.php?tid=1">Holiday giveaway</a>
      <div class="breadcrumb"><a href="/index.php">Hack Forums</a></div>
    </div></div>`;

  afterEach(() => jest.restoreAllMocks());

  it("adds a dismiss button to a non-div banner preceded by a style block", async () => {
    document.body.innerHTML = anchorBannerPage;
    jest
      .spyOn((HideHeaderBanners as any).settingsService, "getStorageItem")
      .mockResolvedValue("");

    await HideHeaderBanners.run({ hideAdTicker: false, hideGlobalBanners: true });

    expect(
      document.querySelector("#hf-holiday-announcement .HFXDismissBanner")
    ).not.toBeNull();
    expect(document.querySelector(".breadcrumb .HFXDismissBanner")).toBeNull();
  });

  const divBannerPage = `
    <div id="content"><div class="wrapper-content">
      <div style="text-align: center; padding: 6px;">
        <div><strong>Site announcement</strong></div>
        <a href="/showthread.php?tid=2">Read more</a>
      </div>
      <div class="breadcrumb"><a href="/index.php">Hack Forums</a></div>
    </div></div>`;

  it("adds a dismiss button to the previous div banner format", async () => {
    document.body.innerHTML = divBannerPage;
    jest
      .spyOn((HideHeaderBanners as any).settingsService, "getStorageItem")
      .mockResolvedValue("");

    await HideHeaderBanners.run({ hideAdTicker: false, hideGlobalBanners: true });

    const wrapper = document.querySelector(".wrapper-content")!;
    const banner = wrapper.firstElementChild!;
    expect(banner.querySelector(":scope > .HFXDismissBanner")).not.toBeNull();
    expect(document.querySelectorAll(".HFXDismissBanner")).toHaveLength(1);
  });

  it("dismisses and then hides the previous div banner format", async () => {
    document.body.innerHTML = divBannerPage;
    let stored = "";
    jest
      .spyOn((HideHeaderBanners as any).settingsService, "getStorageItem")
      .mockImplementation(async () => stored);
    jest
      .spyOn((HideHeaderBanners as any).settingsService, "setStorageItem")
      .mockImplementation(async (...args: any[]) => {
        stored = args[2];
      });

    await HideHeaderBanners.run({ hideAdTicker: false, hideGlobalBanners: true });
    document.querySelector<HTMLElement>(".HFXDismissBanner")!.click();
    await Promise.resolve();

    expect(stored).not.toBe("");
    expect(document.querySelector(".wrapper-content")!.children).toHaveLength(1);

    // Next page load: the stored hash hides the banner without user action
    document.body.innerHTML = divBannerPage;
    await HideHeaderBanners.run({ hideAdTicker: false, hideGlobalBanners: true });

    const remaining = document.querySelector(".wrapper-content")!.children;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].classList.contains("breadcrumb")).toBe(true);
  });

  it("leaves the breadcrumb alone when there is no banner", async () => {
    document.body.innerHTML = `
      <div id="content"><div class="wrapper-content">
        <br>
        <div class="breadcrumb"><a href="/index.php">Hack Forums</a></div>
      </div></div>`;

    await HideHeaderBanners.run({ hideAdTicker: false, hideGlobalBanners: true });

    expect(document.querySelector(".HFXDismissBanner")).toBeNull();
    expect(document.querySelector(".breadcrumb")).not.toBeNull();
  });

  it("removes a previously dismissed non-div banner", async () => {
    document.body.innerHTML = anchorBannerPage;
    const banner = document.querySelector<HTMLElement>("#hf-holiday-announcement")!;
    const hash = (HideHeaderBanners as any).getBannerHash(banner);
    jest
      .spyOn((HideHeaderBanners as any).settingsService, "getStorageItem")
      .mockResolvedValue(hash);

    await HideHeaderBanners.run({ hideAdTicker: false, hideGlobalBanners: true });

    expect(document.querySelector("#hf-holiday-announcement")).toBeNull();
    expect(document.querySelector(".breadcrumb")).not.toBeNull();
  });
});
