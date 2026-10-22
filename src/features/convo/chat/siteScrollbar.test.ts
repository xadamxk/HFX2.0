import { mirrorSiteScrollbar, readSiteScrollbarColors } from "./siteScrollbar";

// HF's notify_4.css today
const NOTIFY_CSS = `
#notify-notifications-container::-webkit-scrollbar { height: 10px; width: 3px; border-radius: 4px; background: rgb(34, 34, 34); transition: 0.3s; }
#notify-notifications-container::-webkit-scrollbar:hover { background: rgb(40, 40, 40); }
#notify-notifications-container::-webkit-scrollbar-thumb { background: rgb(17, 17, 17); border-radius: 4px; }
`;

const addStyle = (css: string) => {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
};

describe("readSiteScrollbarColors", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("reads the notification panel's thumb and track, not its hover", () => {
    addStyle(NOTIFY_CSS);
    expect(readSiteScrollbarColors()).toEqual({
      thumb: "rgb(17, 17, 17)",
      track: "rgb(34, 34, 34)",
    });
  });

  it("follows HF if the colors change, including inside @media", () => {
    addStyle(`@media screen {
      #notify-notifications-container::-webkit-scrollbar-thumb { background-color: rgb(1, 2, 3); }
    }`);
    expect(readSiteScrollbarColors()).toEqual({ thumb: "rgb(1, 2, 3)" });
  });

  it("finds nothing when HF has no such rules", () => {
    addStyle(".other::-webkit-scrollbar-thumb { background: red; }");
    expect(readSiteScrollbarColors()).toEqual({});
  });
});

describe("mirrorSiteScrollbar", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("sets the dock's scrollbar colors from the page", () => {
    addStyle(NOTIFY_CSS);
    const root = document.createElement("div");
    mirrorSiteScrollbar(root);
    expect(root.style.getPropertyValue("--hfx-chat-scroll-thumb")).toBe(
      "rgb(17, 17, 17)"
    );
    expect(root.style.getPropertyValue("--hfx-chat-scroll-track")).toBe(
      "rgb(34, 34, 34)"
    );
  });

  it("leaves the stylesheet's fallback when nothing is found", () => {
    const root = document.createElement("div");
    mirrorSiteScrollbar(root);
    expect(root.style.getPropertyValue("--hfx-chat-scroll-thumb")).toBe("");
  });

  it("tries again on load while the page is still loading", () => {
    const listeners: Record<string, () => void> = {};
    const doc = {
      readyState: "loading",
      createElement: (tag: string) => document.createElement(tag),
      styleSheets: [] as unknown as StyleSheetList,
      defaultView: {
        addEventListener: (event: string, listener: () => void) => {
          listeners[event] = listener;
        },
      },
    } as unknown as Document;
    const root = document.createElement("div");
    mirrorSiteScrollbar(root, doc);
    expect(listeners.load).toBeDefined();

    addStyle(NOTIFY_CSS);
    (doc as { styleSheets: StyleSheetList }).styleSheets = document.styleSheets;
    listeners.load();
    expect(root.style.getPropertyValue("--hfx-chat-scroll-track")).toBe(
      "rgb(34, 34, 34)"
    );
  });
});
