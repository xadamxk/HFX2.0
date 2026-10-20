/**
 * Pins an element to the top of the viewport once the page scrolls past it,
 * leaving a same-height placeholder behind so the content below doesn't jump.
 *
 * An IntersectionObserver watches the element (or, while pinned, its
 * placeholder) cross the pin line, so nothing runs on scroll. Because it
 * watches the live position rather than a cached one, the switch point stays
 * right when other features add or remove content above the element (an HFX
 * alert, a dismissed header banner). Left/width are only measured when
 * pinning and on window resize, throttled to one update per frame.
 */

export interface StickyOnScrollOptions {
  /** Class added while pinned. It must set `position: fixed`. */
  fixedClass: string;
  /** This element is the site header; other sticky elements pin below it. */
  isHeader?: boolean;
  /** Pin below the sticky header (if there is one) instead of at the top. */
  belowHeader?: boolean;
}

// Height of the sticky header, shared with elements that pin below it. The
// header may start after those elements, so they listen for changes.
let headerHeight = 0;
const headerHeightListeners = new Set<() => void>();

function setHeaderHeight(height: number): void {
  if (height === headerHeight) return;
  headerHeight = height;
  headerHeightListeners.forEach((listener) => listener());
}

export class StickyOnScroll {
  private readonly placeholder: HTMLDivElement;
  private observer?: IntersectionObserver;
  private observed?: Element;
  private pinned = false;
  private offset = 0;
  private resizeFrame = 0;

  constructor(
    private readonly element: HTMLElement,
    private readonly options: StickyOnScrollOptions
  ) {
    this.placeholder = document.createElement("div");
    this.placeholder.style.display = "none";
    this.placeholder.style.width = "100%";
    element.parentElement?.insertBefore(this.placeholder, element);

    if (options.isHeader) {
      setHeaderHeight(element.offsetHeight);
    }
    if (options.belowHeader) {
      headerHeightListeners.add(this.observe);
    }
    window.addEventListener("resize", this.onResize);
    this.observe();
  }

  /** Stop watching, unpin the element and remove the placeholder. */
  destroy(): void {
    this.observer?.disconnect();
    window.removeEventListener("resize", this.onResize);
    cancelAnimationFrame(this.resizeFrame);
    headerHeightListeners.delete(this.observe);
    this.unpin();
    this.placeholder.remove();
    if (this.options.isHeader) {
      setHeaderHeight(0);
    }
  }

  /** (Re)create the observer for the current pin line and observe the in-flow box. */
  private observe = (): void => {
    this.observer?.disconnect();
    // Overlap the header by 1px so no gap shows between the two
    this.offset = this.options.belowHeader ? Math.max(0, headerHeight - 1) : 0;
    if (this.pinned) {
      this.element.style.top = `${this.offset}px`;
    }
    this.observer = new IntersectionObserver(this.onIntersect, {
      rootMargin: `${-this.offset}px 0px 0px 0px`,
      // 1 catches the top edge crossing the pin line while the box is otherwise
      // visible; 0 catches it jumping fully in or out of view
      threshold: [0, 1],
    });
    this.observed = this.pinned ? this.placeholder : this.element;
    this.observer.observe(this.observed);
  };

  private onIntersect = (entries: IntersectionObserverEntry[]): void => {
    // Ignore queued entries for the box observed before the last switch
    const entry = entries.filter((e) => e.target === this.observed).pop();
    if (!entry) return;

    const pinLine = entry.rootBounds ? entry.rootBounds.top : this.offset;
    const shouldPin = entry.boundingClientRect.top < pinLine;
    if (shouldPin === this.pinned) return;

    if (shouldPin) {
      this.pin();
    } else {
      this.unpin();
    }
    // While pinned the element is out of flow, so watch its placeholder instead
    this.observer?.unobserve(entry.target);
    this.observed = this.pinned ? this.placeholder : this.element;
    this.observer?.observe(this.observed);
  };

  private pin(): void {
    this.placeholder.style.height = `${this.element.offsetHeight}px`;
    this.placeholder.style.display = "block";
    this.element.classList.add(this.options.fixedClass);
    this.element.style.top = `${this.offset}px`;
    this.pinned = true;
    this.updateFixedMetrics();
  }

  private unpin(): void {
    this.element.classList.remove(this.options.fixedClass);
    this.placeholder.style.display = "none";
    this.element.style.left = "";
    this.element.style.width = "";
    this.element.style.top = "";
    this.pinned = false;
  }

  /** Line the pinned element up with the placeholder it left behind. */
  private updateFixedMetrics(): void {
    const rect = this.placeholder.getBoundingClientRect();
    const style = window.getComputedStyle(this.element);
    // A content-box width excludes padding and border, so take them off
    const horizontalExtra =
      style.boxSizing === "border-box"
        ? 0
        : (parseFloat(style.paddingLeft) || 0) +
          (parseFloat(style.paddingRight) || 0) +
          (parseFloat(style.borderLeftWidth) || 0) +
          (parseFloat(style.borderRightWidth) || 0);

    this.element.style.left = `${rect.left}px`;
    this.element.style.width = `${rect.width - horizontalExtra}px`;
  }

  private onResize = (): void => {
    if (this.resizeFrame) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = 0;
      if (this.pinned) {
        this.updateFixedMetrics();
        this.placeholder.style.height = `${this.element.offsetHeight}px`;
      }
      if (this.options.isHeader) {
        setHeaderHeight(this.element.offsetHeight);
      }
    });
  };
}
