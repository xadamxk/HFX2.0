import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { StorageService } from "../../core/StorageService";
import { MemoryStorage } from "../../test-utils/MemoryStorage";
import { UserNotesPanel } from "./UserNotesPanel";
import { PopupProvider } from "./contexts/PopupContext";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Listener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void;

describe("UserNotesPanel", () => {
  let container: HTMLDivElement;
  let root: Root;
  let local: MemoryStorage;
  let listeners: Listener[];

  const settle = () =>
    act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  const rows = () => Array.from(container.querySelectorAll("tbody tr"));
  const button = (row: Element, label: string) =>
    Array.from(row.querySelectorAll("button")).find(
      (b) => b.textContent === label
    )!;

  async function render() {
    act(() =>
      root.render(
        <PopupProvider>
          <UserNotesPanel />
        </PopupProvider>
      )
    );
    await settle();
  }

  beforeEach(() => {
    listeners = [];
    (chrome.storage as any).onChanged = {
      addListener: jest.fn((listener: Listener) => listeners.push(listener)),
      removeListener: jest.fn(),
    };
    local = new MemoryStorage({
      "UserNotes:notes:1": {
        "17": { n: "paid fast", u: "Alice", t: 2 },
        "33": { d: 1, t: 3 },
      },
      "UserNotes:notes:2": { "2": { n: "<b>check PMs</b>", t: 5 } },
    });
    jest
      .spyOn(StorageService, "getInstance")
      .mockReturnValue(new StorageService(local, new MemoryStorage()));
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
    delete (chrome.storage as any).onChanged;
  });

  it("lists notes newest first, with usage and without deleted notes", async () => {
    await render();

    expect(rows().map((row) => row.getAttribute("data-uid"))).toEqual([
      "2",
      "17",
    ]);
    expect(rows()[0].querySelector(".user-notes-text")!.textContent).toBe(
      "<b>check PMs</b>"
    );
    expect(rows()[0].querySelector("b")).toBeNull();
    expect(rows()[0].querySelector("a")!.textContent).toBe("uid 2");
    expect(rows()[1].querySelector("a")!.getAttribute("href")).toBe(
      "https://hackforums.net/member.php?action=profile&uid=17"
    );
    expect(container.textContent).toMatch(/KB of 64\.0 KB used · 2 notes/);
  });

  it("filters by note text or username", async () => {
    await render();
    const filter =
      container.querySelector<HTMLInputElement>(".user-notes-filter")!;

    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )!.set!;
      setValue.call(filter, "alice");
      filter.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(rows().map((row) => row.getAttribute("data-uid"))).toEqual(["17"]);
  });

  it("edits a note", async () => {
    await render();
    act(() => button(rows()[1], "Edit").click());

    const textarea = rows()[1].querySelector("textarea")!;
    expect(textarea.maxLength).toBe(256);
    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value"
      )!.set!;
      setValue.call(textarea, "paid fast, twice");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => button(rows()[1], "Save").click());
    await settle();

    expect(local.items["UserNotes:notes:1"]["17"]).toMatchObject({
      n: "paid fast, twice",
      u: "Alice",
    });
  });

  it("deletes a note after confirming", async () => {
    await render();
    act(() => button(rows()[1], "Delete").click());
    act(() => button(rows()[1], "Confirm").click());
    await settle();

    expect(local.items["UserNotes:notes:1"]["17"]).toMatchObject({ d: 1 });
  });

  it("reloads when notes change elsewhere", async () => {
    await render();
    local.items["UserNotes:notes:3"] = { "3": { n: "new", t: 9 } };

    act(() =>
      listeners.forEach((listener) =>
        listener({ "UserNotes:notes:3": { newValue: {} } }, "local")
      )
    );
    await settle();

    expect(rows().map((row) => row.getAttribute("data-uid"))).toEqual([
      "3",
      "2",
      "17",
    ]);
  });

  it("shows only usage and a link to the options page in the popup", async () => {
    window.history.pushState({}, "", "/options.html?popup=true");
    (chrome.runtime as any).openOptionsPage = jest.fn();
    try {
      await render();

      expect(container.querySelector("table")).toBeNull();
      expect(container.textContent).toMatch(/2 notes/);
      act(() => container.querySelector("button")!.click());
      expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
    } finally {
      window.history.pushState({}, "", "/");
      delete (chrome.runtime as any).openOptionsPage;
    }
  });

  it("explains how to add a note when there are none", async () => {
    local.items = {};
    await render();

    expect(container.querySelector("table")).toBeNull();
    expect(container.textContent).toMatch(/No notes yet/);
  });
});
