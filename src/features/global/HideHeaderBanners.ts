import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Feature } from "../../core/Feature";
import { Util } from "../../core/Util";
import Global from "../../sections/Global";

enum STORAGE_KEYS {
  BANNER_HASH = "bannerHash",
}

class HideHeaderBanners extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Hide Header Banners",
      enabled: true,
      description: "Hide various elements from the page header.",
      configurables: [
        new Checkbox({
          id: "hideAdTicker",
          label: "Hide Ad Ticker",
          description: "Hides the ad ticker from the header.",
          default: true,
        }),
        new Checkbox({
          id: "hideGlobalBanners",
          label: "Dismiss Global Banners",
          description: "Allows you to hide the global banners from the header. Reappears if the banner changes.",
          default: true,
        }),
      ],
      storageItems: [
        {
          id: STORAGE_KEYS.BANNER_HASH,
          description: "Global Banner Hash",
          defaultValue: "",
        },
      ],
    });
  }

  async run(settings: any) {
    const hideAdTicker = settings.hideAdTicker;
    const hideGlobalBanners = settings.hideGlobalBanners;

    if (hideAdTicker) {
      const adTicker = this.querySelector(".hf-ad-ticker");
      if (adTicker) {
        adTicker.remove();
      }
    }

    if (hideGlobalBanners) {
      const contentWrapper = this.querySelector("#content > div.wrapper-content");
      const firstWrapperDiv =
        contentWrapper?.querySelector<HTMLElement>("div");

      if (!firstWrapperDiv || firstWrapperDiv.classList.contains("breadcrumb")) {
        return;
      }

      const bannerHash = this.getBannerHash(firstWrapperDiv);
      const storedBannerHash = await this.settingsService.getStorageItem(
        this,
        STORAGE_KEYS.BANNER_HASH
      );

      if (storedBannerHash === bannerHash) {
        // Banner was previously dismissed
        firstWrapperDiv.remove();
        return;
      }

      this.appendDismissButton(firstWrapperDiv, bannerHash);
    }
  }

  /**
   * Banners have no ids or classes to key off of, so build an identifier from
   * their normalized text and link targets instead.
   */
  private getBannerHash(banner: HTMLElement): string {
    const text = (banner.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    const links = Array.from(banner.querySelectorAll("a"))
      .map((anchor) => anchor.getAttribute("href") || "")
      .join("|");

    // djb2
    let hash = 5381;
    const input = `${text}::${links}`;
    for (let index = 0; index < input.length; index++) {
      hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0;
    }
    return (hash >>> 0).toString(16);
  }

  /**
   * Adds a dismiss button to the top right of the banner. Dismissing stores the
   * banner's hash so it stays hidden on subsequent page loads.
   */
  private appendDismissButton(banner: HTMLElement, bannerHash: string): void {
    const DISMISS_BUTTON_CLASS = "HFXDismissBanner";
    if (banner.querySelector(`.${DISMISS_BUTTON_CLASS}`)) {
      return;
    }

    const dismissButton = document.createElement("a");
    dismissButton.className = DISMISS_BUTTON_CLASS;
    dismissButton.href = "javascript:void(0);";
    dismissButton.title = "Dismiss Banner";
    dismissButton.style.position = "absolute";
    dismissButton.style.top = "4px";
    dismissButton.style.right = "6px";
    dismissButton.style.lineHeight = "0";
    dismissButton.style.zIndex = "1";

    const dismissIcon = document.createElement("img");
    dismissIcon.src = Util.getURL("/assets/dismiss_notice.png");
    dismissIcon.alt = "Dismiss";
    dismissButton.appendChild(dismissIcon);

    dismissButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.settingsService.setStorageItem(
        this,
        STORAGE_KEYS.BANNER_HASH,
        bannerHash
      );
      banner.remove();
    });

    // The banner is positioned statically; anchor the button to it
    if (!banner.style.position || banner.style.position === "static") {
      banner.style.position = "relative";
    }
    banner.appendChild(dismissButton);
  }
}

export default new HideHeaderBanners();
