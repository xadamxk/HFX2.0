import StickyPostTitle from "./StickyPostTitle";

describe("StickyPostTitle", () => {
  let observed: Element[];
  let report: IntersectionObserverCallback;

  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = `
      <table><tr><td class="thead"><h1>Thread title</h1></td></tr></table>`;
    observed = [];
    (window as any).IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        report = callback;
      }
      observe(target: Element) {
        observed.push(target);
      }
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("watches the title with an observer instead of a scroll listener", () => {
    const addListener = jest.spyOn(window, "addEventListener");

    StickyPostTitle.run({});

    const title = document.querySelector("td.thead")!;
    expect(observed).toEqual([title]);
    expect(addListener.mock.calls.map(([type]) => type)).not.toContain(
      "scroll"
    );
    expect(document.getElementById("hfx-sticky-post-title-style")).not.toBeNull();
  });

  it("pins the title once it scrolls past the top", () => {
    StickyPostTitle.run({});
    const title = document.querySelector<HTMLElement>("td.thead")!;

    report(
      [
        {
          target: title,
          boundingClientRect: { top: -2 } as DOMRectReadOnly,
          rootBounds: { top: 0 } as DOMRectReadOnly,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver
    );

    expect(title.classList.contains("hfx-fixed-post-title")).toBe(true);
    expect((title.previousElementSibling as HTMLElement).style.display).toBe(
      "block"
    );
  });

  it("does nothing without a thread title", () => {
    document.body.innerHTML = "<h1>Not a thread</h1>";

    StickyPostTitle.run({});

    expect(observed).toEqual([]);
  });
});
