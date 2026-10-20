import { Feature } from "../../core/Feature";
import { StickyOnScroll } from "../../core/StickyOnScroll";
import Threads from "../../sections/Threads";

class StickyPostTitle extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Sticky Post Title",
      description: "Makes the thread title sticky when scrolling.",
      enabled: true,
      configurables: [],
    });
  }

  run(_settings: any) {
    const h1 = this.querySelector<HTMLElement>("h1", document);
    if (!h1) {
      return;
    }

    const titleContainer = h1.closest("td.thead") as HTMLElement;
    if (!titleContainer) {
      return;
    }

    this.injectStyles();
    // Pins below the toolbar's sticky header when that is on
    new StickyOnScroll(titleContainer, {
      fixedClass: "hfx-fixed-post-title",
      belowHeader: true,
    });
  }

  private injectStyles() {
    const styleId = "hfx-sticky-post-title-style";
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .hfx-fixed-post-title {
        position: fixed;
        z-index: 99;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
  }
}

export default new StickyPostTitle();
