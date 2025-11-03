import { Feature } from "../../core/Feature";
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
    const placeholder = this.createPlaceholder(titleContainer);
    const titleInitialTop = titleContainer.getBoundingClientRect().top + window.scrollY;

    const updatePosition = () => this.updateFixedMetrics(titleContainer, placeholder);
    const handleScrollOrResize = () => this.handleScrollOrResize(titleContainer, placeholder, titleInitialTop, updatePosition);

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", () => {
      placeholder.style.height = `${titleContainer.offsetHeight}px`;
      handleScrollOrResize();
    });

    handleScrollOrResize();
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

  private createPlaceholder(titleContainer: HTMLElement): HTMLDivElement {
    const placeholder = document.createElement("div");
    placeholder.style.display = "none";
    titleContainer.parentElement?.insertBefore(placeholder, titleContainer);
    return placeholder;
  }

  private getHeaderElement(): HTMLElement | null {
    return document.querySelector(".panel-nav-lower.hfx-fixed-header");
  }

  private updateFixedMetrics(titleContainer: HTMLElement, placeholder: HTMLElement) {
    const rect = placeholder.getBoundingClientRect();
    titleContainer.style.left = `${rect.left}px`;
    titleContainer.style.width = `${rect.width}px`;

    const header = this.getHeaderElement();
    const headerHeight = header ? header.offsetHeight - 1 : 0;
    titleContainer.style.top = `${headerHeight}px`;
  }

  private handleScrollOrResize(
    titleContainer: HTMLElement,
    placeholder: HTMLElement,
    titleInitialTop: number,
    updatePosition: () => void
  ) {
    const header = this.getHeaderElement();
    const headerHeight = header ? header.offsetHeight : 0;
    const scrollThreshold = titleInitialTop - headerHeight;
    const shouldFix = window.scrollY >= scrollThreshold;
    const isFixed = titleContainer.classList.contains("hfx-fixed-post-title");

    if (!shouldFix) {
      if (!isFixed) {
        return;
      }

      titleContainer.classList.remove("hfx-fixed-post-title");
      placeholder.style.display = "none";
      titleContainer.style.left = "";
      titleContainer.style.width = "";
      titleContainer.style.top = "";
      return;
    }

    if (!isFixed) {
      placeholder.style.height = `${titleContainer.offsetHeight}px`;
      placeholder.style.display = "block";
      titleContainer.classList.add("hfx-fixed-post-title");
    }

    updatePosition();
  }
}

export default new StickyPostTitle();
