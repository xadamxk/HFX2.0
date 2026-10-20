import { StickyOnScroll } from "./StickyOnScroll";

// jsdom has no IntersectionObserver or layout, so record observers and let
// each test report where the observed box sits relative to the pin line.
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.add(target);
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }

  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }

  /** Report `target` with its top edge at `top`, against a pin line at `pinLine`. */
  report(target: Element, top: number, pinLine = 0) {
    this.callback(
      [
        {
          target,
          boundingClientRect: { top } as DOMRectReadOnly,
          rootBounds: { top: pinLine } as DOMRectReadOnly,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver
    );
  }
}

const latestObserver = () =>
  FakeIntersectionObserver.instances[
    FakeIntersectionObserver.instances.length - 1
  ];

const setOffsetHeight = (element: HTMLElement, height: number) =>
  Object.defineProperty(element, "offsetHeight", {
    configurable: true,
    value: height,
  });

const placeholderFor = (element: HTMLElement) =>
  element.previousElementSibling as HTMLElement;

describe("StickyOnScroll", () => {
  let header: HTMLElement;
  let sticky: StickyOnScroll[];
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="nav"><div class="panel-nav-lower">Nav</div></div>
      <table><tr><td class="thead"><h1>Title</h1></td></tr></table>`;
    header = document.querySelector<HTMLElement>(".panel-nav-lower")!;
    setOffsetHeight(header, 40);
    sticky = [];
    FakeIntersectionObserver.instances = [];
    (window as any).IntersectionObserver = FakeIntersectionObserver;

    frames = [];
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => frames.push(callback));
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    // Also resets the shared header height between tests
    sticky.forEach((instance) => instance.destroy());
    jest.restoreAllMocks();
  });

  const makeSticky = (...args: ConstructorParameters<typeof StickyOnScroll>) => {
    const instance = new StickyOnScroll(...args);
    sticky.push(instance);
    return instance;
  };

  it("pins via an observer instead of listening to scroll", () => {
    const addListener = jest.spyOn(window, "addEventListener");

    makeSticky(header, { fixedClass: "pinned", isHeader: true });

    expect(addListener.mock.calls.map(([type]) => type)).not.toContain(
      "scroll"
    );
    expect(latestObserver().observed.has(header)).toBe(true);
    expect(latestObserver().options.rootMargin).toBe("0px 0px 0px 0px");
    expect(placeholderFor(header).style.display).toBe("none");
  });

  it("pins once the element passes the top and unpins when its placeholder returns", () => {
    makeSticky(header, { fixedClass: "pinned", isHeader: true });
    const observer = latestObserver();
    const placeholder = placeholderFor(header);

    observer.report(header, 10);
    expect(header.classList.contains("pinned")).toBe(false);

    observer.report(header, -1);
    expect(header.classList.contains("pinned")).toBe(true);
    expect(placeholder.style.display).toBe("block");
    expect(placeholder.style.height).toBe("40px");
    expect(header.style.top).toBe("0px");
    // While pinned the in-flow placeholder marks where the header belongs
    expect(observer.observed.has(placeholder)).toBe(true);
    expect(observer.observed.has(header)).toBe(false);

    // Placeholder partly scrolled out: stay pinned
    observer.report(placeholder, -20);
    expect(header.classList.contains("pinned")).toBe(true);

    observer.report(placeholder, 0);
    expect(header.classList.contains("pinned")).toBe(false);
    expect(placeholder.style.display).toBe("none");
    expect(header.style.top).toBe("");
    expect(observer.observed.has(header)).toBe(true);
  });

  it("unpins when content inserted above pushes the placeholder back below the line", () => {
    makeSticky(header, { fixedClass: "pinned", isHeader: true });
    const observer = latestObserver();

    observer.report(header, -5);
    expect(header.classList.contains("pinned")).toBe(true);

    // e.g. HFXAlerts inserting an alert above while scrolled just past the header
    observer.report(placeholderFor(header), 30);
    expect(header.classList.contains("pinned")).toBe(false);
  });

  it("ignores queued entries for the box it stopped observing", () => {
    makeSticky(header, { fixedClass: "pinned", isHeader: true });
    const observer = latestObserver();

    observer.report(header, -5);
    observer.report(header, 50);

    expect(header.classList.contains("pinned")).toBe(true);
  });

  it("subtracts padding and border from a content-box width", () => {
    header.style.paddingLeft = "5px";
    header.style.paddingRight = "5px";
    header.style.borderLeft = "1px solid";
    header.style.borderRight = "1px solid";
    makeSticky(header, { fixedClass: "pinned", isHeader: true });
    jest
      .spyOn(placeholderFor(header), "getBoundingClientRect")
      .mockReturnValue({ left: 100, width: 800 } as DOMRect);

    latestObserver().report(header, -1);

    expect(header.style.left).toBe("100px");
    expect(header.style.width).toBe("788px");
  });

  it("pins below the sticky header, even when the header starts later", () => {
    const title = document.querySelector<HTMLElement>("td.thead")!;
    makeSticky(title, { fixedClass: "pinned-title", belowHeader: true });
    const firstObserver = latestObserver();
    expect(firstObserver.options.rootMargin).toBe("0px 0px 0px 0px");

    makeSticky(header, { fixedClass: "pinned", isHeader: true });

    // The title's observer was rebuilt with a pin line just under the header
    expect(firstObserver.disconnected).toBe(true);
    const titleObserver = FakeIntersectionObserver.instances.find(
      (instance) => instance.observed.has(title)
    )!;
    expect(titleObserver.options.rootMargin).toBe("-39px 0px 0px 0px");

    titleObserver.report(title, 38, 39);
    expect(title.classList.contains("pinned-title")).toBe(true);
    expect(title.style.top).toBe("39px");
  });

  it("re-measures once per frame on resize", () => {
    const title = document.querySelector<HTMLElement>("td.thead")!;
    makeSticky(header, { fixedClass: "pinned", isHeader: true });
    makeSticky(title, { fixedClass: "pinned-title", belowHeader: true });
    const headerObserver = FakeIntersectionObserver.instances.find(
      (instance) => instance.observed.has(header)
    )!;
    headerObserver.report(header, -1);
    const rect = jest
      .spyOn(placeholderFor(header), "getBoundingClientRect")
      .mockReturnValue({ left: 0, width: 600 } as DOMRect);

    for (let i = 0; i < 5; i++) {
      window.dispatchEvent(new Event("resize"));
    }
    // One frame queued per sticky element, not one per event
    expect(frames).toHaveLength(2);

    // The header wrapped onto two lines at the new width
    setOffsetHeight(header, 80);
    frames.forEach((frame) => frame(0));

    expect(rect).toHaveBeenCalledTimes(1);
    expect(header.style.width).toBe("600px");
    expect(placeholderFor(header).style.height).toBe("80px");
    const titleObserver = latestObserver();
    expect(titleObserver.observed.has(title)).toBe(true);
    expect(titleObserver.options.rootMargin).toBe("-79px 0px 0px 0px");
  });

  it("cleans up on destroy", () => {
    const instance = makeSticky(header, { fixedClass: "pinned", isHeader: true });
    latestObserver().report(header, -1);

    instance.destroy();
    sticky = [];

    expect(header.classList.contains("pinned")).toBe(false);
    expect(header.previousElementSibling).toBeNull();
    expect(latestObserver().disconnected).toBe(true);
  });
});
