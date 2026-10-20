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
});
