import { StorageService } from "../../core/StorageService";
import { getSyncItemSize } from "../../core/constants";
import { UserNotesStore } from "../../core/UserNotesStore";
import { Util } from "../../core/Util";
import { MemoryStorage } from "../../test-utils/MemoryStorage";
import Threads from "../../sections/Threads";
import Profile from "../../sections/Profile";
import UserNotes, { getNoteColor } from "./UserNotes";

type Listener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void;

function post(pid: number, uid: number, name: string): string {
  const href = uid
    ? `https://hackforums.net/member.php?action=profile&amp;uid=${uid}`
    : "";
  return `
    <div class="post" id="post_${pid}">
      <div class="post_author">
        <div class="author_information">
          <strong><span class="largetext">${
            uid
              ? `<a href="${href}"><span class="group2">${name}</span></a>`
              : name
          }</span></strong>
          <br>
          <span class="smalltext">Member</span>
        </div>
      </div>
      <div class="post_body"><blockquote>quoted ${name}</blockquote></div>
    </div>`;
}

describe("UserNotes", () => {
  let local: MemoryStorage;
  let storageListeners: Listener[];

  /** Let pending storage reads and writes finish. */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  const toggles = () =>
    Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".hfx-user-note-toggle")
    );
  const noteTexts = () =>
    Array.from(document.querySelectorAll(".hfx-user-note-text")).map(
      (n) => n.textContent
    );

  async function openEditorAndSave(index: number, text: string) {
    toggles()[index].click();
    const textarea = document.querySelector<HTMLTextAreaElement>(
      ".hfx-user-note-editor textarea"
    )!;
    textarea.value = text;
    textarea.dispatchEvent(new Event("input"));
    const save = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        ".hfx-user-note-editor button"
      )
    ).find((b) => b.textContent === "Save")!;
    save.click();
    await settle();
  }

  beforeEach(() => {
    storageListeners = [];
    (chrome.storage as any).onChanged = {
      addListener: jest.fn((listener: Listener) =>
        storageListeners.push(listener)
      ),
    };
    local = new MemoryStorage();
    jest
      .spyOn(StorageService, "getInstance")
      .mockReturnValue(new StorageService(local, new MemoryStorage()));
    jest.spyOn(Util, "addCssToPage").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (chrome.storage as any).onChanged;
    document.body.innerHTML = "";
  });

  describe("on threads", () => {
    beforeEach(() => {
      document.body.innerHTML =
        post(1, 17, "Alice") +
        post(2, 33, "Bob") +
        post(3, 17, "Alice") +
        post(4, 0, "Guest");
    });

    it("adds an icon by each member's name and no note badge without a note", async () => {
      await UserNotes.run({}, Threads);

      expect(toggles()).toHaveLength(3);
      expect(toggles()[0].previousElementSibling?.tagName).toBe("STRONG");
      expect(toggles()[0].querySelector("i")!.className).toBe(
        "far fa-sticky-note"
      );
      expect(document.querySelectorAll(".hfx-user-note-text")).toHaveLength(0);
      // Below the name's <br>, so it doesn't add an empty line
      expect(
        document.querySelector(".hfx-user-note")!.previousElementSibling
          ?.tagName
      ).toBe("BR");
    });

    it("shows a saved note on every post by that member, and only there", async () => {
      local.items = {
        "UserNotes:notes:1": { "17": { n: "paid fast", u: "Alice", t: 1 } },
      };

      await UserNotes.run({}, Threads);

      expect(noteTexts()).toEqual(["paid fast", "paid fast"]);
      const posts = document.querySelectorAll(".post");
      expect(posts[0].querySelector(".hfx-user-note-text")).not.toBeNull();
      expect(posts[1].querySelector(".hfx-user-note-text")).toBeNull();
      expect(
        document.querySelector("blockquote .hfx-user-note-text")
      ).toBeNull();
      expect(toggles()[0].querySelector("i")!.className).toBe(
        "fas fa-sticky-note"
      );
    });

    it("saves from the editor and updates the member's other posts at once", async () => {
      await UserNotes.run({}, Threads);

      await openEditorAndSave(0, "  trusted trader ");

      expect(local.items["UserNotes:notes:1"]["17"]).toMatchObject({
        n: "trusted trader",
        u: "Alice",
      });
      expect(noteTexts()).toEqual(["trusted trader", "trusted trader"]);
      expect(document.querySelector(".hfx-user-note-editor")).toBeNull();
    });

    it("shows note text containing markup as literal text", async () => {
      await UserNotes.run({}, Threads);

      await openEditorAndSave(
        1,
        `<b>bold</b><script>window.__xss=1</script><img src=x onerror="window.__xss=1">`
      );

      const note = document
        .querySelectorAll(".post")[1]
        .querySelector(".hfx-user-note-text")!;
      expect(note.textContent).toBe(
        `<b>bold</b><script>window.__xss=1</script><img src=x onerror="window.__xss=1">`
      );
      expect(note.querySelector("b, script, img")).toBeNull();
      expect((window as any).__xss).toBeUndefined();
    });

    it("limits the editor to 256 characters and counts them", async () => {
      await UserNotes.run({}, Threads);
      toggles()[0].click();

      const textarea = document.querySelector<HTMLTextAreaElement>(
        ".hfx-user-note-editor textarea"
      )!;
      expect(textarea.maxLength).toBe(256);
      textarea.value = "abc";
      textarea.dispatchEvent(new Event("input"));
      expect(document.querySelector(".hfx-user-note-count")!.textContent).toBe(
        "3 / 256"
      );
    });

    it("deletes a note everywhere on the page", async () => {
      local.items = { "UserNotes:notes:1": { "17": { n: "note", t: 1 } } };
      await UserNotes.run({}, Threads);

      toggles()[2].click();
      const remove = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          ".hfx-user-note-editor button"
        )
      ).find((b) => b.textContent === "Delete")!;
      remove.click();
      await settle();

      expect(noteTexts()).toEqual([]);
      expect(local.items["UserNotes:notes:1"]["17"]).toMatchObject({ d: 1 });
    });

    it("shows the error and keeps the editor open when a note doesn't fit", async () => {
      // One shard just under the 8 KB sync item limit
      const shard: { [uid: string]: object } = {};
      for (let i = 2; i <= 30; i++)
        shard[`${i * 16 + 1}`] = { n: "x".repeat(256), t: 1 };
      local.items = { "UserNotes:notes:1": shard };
      expect(getSyncItemSize("UserNotes:notes:1", shard)).toBeGreaterThan(
        8192 - 300
      );
      expect(getSyncItemSize("UserNotes:notes:1", shard)).toBeLessThanOrEqual(
        8192
      );
      const before = JSON.stringify(local.items);
      await UserNotes.run({}, Threads);

      await openEditorAndSave(0, "y".repeat(256));

      const error = document.querySelector<HTMLElement>(
        ".hfx-user-note-error"
      )!;
      expect(error.hidden).toBe(false);
      expect(error.textContent).toMatch(/Not saved/);
      expect(document.querySelector(".hfx-user-note-editor")).not.toBeNull();
      expect(JSON.stringify(local.items)).toBe(before);
    });

    it("runs one save at a time, even with repeated Ctrl+Enter", async () => {
      const saveSpy = jest.spyOn(UserNotesStore.prototype, "save");
      await UserNotes.run({}, Threads);
      toggles()[0].click();
      const textarea = document.querySelector<HTMLTextAreaElement>(
        ".hfx-user-note-editor textarea"
      )!;
      textarea.value = "once";
      const ctrlEnter = () =>
        textarea.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true })
        );

      ctrlEnter();
      ctrlEnter();
      await settle();

      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(noteTexts()).toEqual(["once", "once"]);
    });

    it("keeps a draft in another editor for the same member when one saves", async () => {
      await UserNotes.run({}, Threads);
      toggles()[2].click();
      const draft = document
        .querySelectorAll(".post")[2]
        .querySelector("textarea")!;
      draft.value = "unsaved draft";

      await openEditorAndSave(0, "saved");

      expect(
        document.querySelectorAll(".post")[2].querySelector("textarea")?.value
      ).toBe("unsaved draft");
      expect(local.items["UserNotes:notes:1"]["17"]).toMatchObject({
        n: "saved",
      });
      expect(noteTexts()).toEqual(["saved"]);
    });

    it("closes the editor on Escape without saving", async () => {
      await UserNotes.run({}, Threads);
      toggles()[0].click();
      const textarea = document.querySelector<HTMLTextAreaElement>(
        ".hfx-user-note-editor textarea"
      )!;
      textarea.value = "draft";
      textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(document.querySelector(".hfx-user-note-editor")).toBeNull();
      expect(local.items).toEqual({});
    });

    it("updates notes changed in another tab or browser", async () => {
      await UserNotes.run({}, Threads);
      local.items = { "UserNotes:notes:1": { "33": { n: "from sync", t: 1 } } };

      storageListeners.forEach((listener) =>
        listener({ "UserNotes:notes:1": { newValue: {} } }, "local")
      );
      await settle();

      expect(noteTexts()).toEqual(["from sync"]);
    });
  });

  describe("on profiles", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="pro-adv-content-info">
          <div class="pro-adv-card">
            <div><span class="largetext"><strong><span class="group2">Alice</span></strong></span></div>
          </div>
        </div>`;
      jest.spyOn(Util, "getProfileUserId").mockReturnValue(17);
    });

    it("shows the member's note by the profile username", async () => {
      local.items = {
        "UserNotes:notes:1": { "17": { n: "check PMs first", t: 1 } },
      };

      await UserNotes.run({}, Profile);

      expect(toggles()).toHaveLength(1);
      expect(toggles()[0].previousElementSibling?.className).toBe("largetext");
      expect(noteTexts()).toEqual(["check PMs first"]);
      expect(document.querySelector(".hfx-user-note--profile")).not.toBeNull();
    });

    it("saves the profile username with the note", async () => {
      await UserNotes.run({}, Profile);

      await openEditorAndSave(0, "note");

      expect(local.items["UserNotes:notes:1"]["17"]).toMatchObject({
        n: "note",
        u: "Alice",
      });
    });
  });

  it("isn't registered for the global section, so Who's Online never shows notes", () => {
    expect(UserNotes.section).toBe(Threads);
    expect(UserNotes.additionalSections?.sections).toEqual([Profile]);
  });

  describe("note color", () => {
    beforeEach(() => {
      document.body.innerHTML = post(1, 17, "Alice");
    });

    it("styles notes with the chosen color", async () => {
      await UserNotes.run({ noteColor: "#3fa7ff" }, Threads);

      const css = (Util.addCssToPage as jest.Mock).mock.calls[0][0] as string;
      expect(css).toContain("color: #3fa7ff;");
      expect(css).toContain("color-mix(in srgb, #3fa7ff 10%, transparent)");
      expect(css).not.toContain("#ffd666");
    });

    it("defaults to yellow", () => {
      expect(UserNotes.configurables?.[0]).toMatchObject({
        id: "noteColor",
        default: "#ffd666",
      });
      expect(getNoteColor(undefined)).toBe("#ffd666");
    });

    it.each(["red", "#12345", "#fff; } body { display: none", 42])(
      "falls back to the default for %p",
      (value) => {
        expect(getNoteColor(value)).toBe("#ffd666");
      }
    );

    it.each(["#abc", "#A1B2C3"])("accepts the hex color %p", (value) => {
      expect(getNoteColor(value)).toBe(value);
    });
  });
});
