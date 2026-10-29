import { ColorPicker } from "../../configuration/configurables/ColorPicker";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { SectionArray } from "../../core/SectionArray";
import { Util } from "../../core/Util";
import { el } from "../../core/Dom";
import { getPosts } from "../../core/Posts";
import {
  USER_NOTE_MAX_LENGTH,
  UserNote,
  UserNotesStore,
  isUserNotesKey,
} from "../../core/UserNotesStore";
import Threads from "../../sections/Threads";
import Profile from "../../sections/Profile";

/** A member's name on the page, with the note UI added next to it. */
interface NoteTarget {
  uid: number;
  username: string;
  toggle: HTMLAnchorElement;
  container: HTMLDivElement;
  editor?: HTMLDivElement;
}

const DEFAULT_NOTE_COLOR = "#ffd666";

/** The note color setting if it's a hex color, so it can go into the page's CSS safely. */
export function getNoteColor(value: unknown): string {
  return typeof value === "string" &&
    /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
    ? value
    : DEFAULT_NOTE_COLOR;
}

/** The note's text, border and tint all come from the note color. */
const getCss = (noteColor: string) => `
.hfx-user-note-toggle { margin-left: 5px; cursor: pointer; color: #999; font-size: 12px; text-decoration: none; }
.hfx-user-note-toggle:hover, .hfx-user-note-toggle.has-note { color: ${noteColor}; }
.hfx-user-note { margin: 4px 0 2px; text-align: left; }
.hfx-user-note--profile { margin: 4px 0 0; }
.hfx-user-note-text { padding: 2px 6px; border-radius: 4px; border: 1px solid color-mix(in srgb, ${noteColor} 35%, transparent);
  background: color-mix(in srgb, ${noteColor} 10%, transparent); color: ${noteColor}; font-size: 11px; line-height: 1.4;
  white-space: pre-wrap; overflow-wrap: anywhere; cursor: pointer; }
.hfx-user-note-editor textarea { box-sizing: border-box; width: 100%; resize: vertical; font-size: 12px; }
.hfx-user-note-editor-footer { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 3px; font-size: 11px; }
.hfx-user-note-editor-footer .button { padding: 2px 7px; font-size: 11px; line-height: 1.5; min-width: 0; }
.hfx-user-note-count { flex-basis: 100%; color: #999; }
.hfx-user-note-error { color: #ff7b7b; font-size: 11px; margin-top: 3px; }
`;

class UserNotes extends Feature {
  private store!: UserNotesStore;
  private notes: Map<number, UserNote> = new Map();
  private targets: NoteTarget[] = [];

  constructor() {
    super({
      id: "UserNotes",
      section: Threads,
      additionalSections: new SectionArray(Profile),
      name: "User Notes",
      enabled: true,
      description:
        "Add a private note to any member. It shows next to their name on their posts and profile, and syncs between your browsers.",
      configurables: [
        new ColorPicker({
          id: "noteColor",
          label: "Note Color",
          description: "The color of the note text and its outline.",
          default: DEFAULT_NOTE_COLOR,
        }),
      ],
    });
  }

  async run(settings: { noteColor?: string }, section: Section) {
    this.store = new UserNotesStore();
    this.targets =
      section === Profile ? this.findProfileTargets() : this.findPostTargets();
    if (this.targets.length === 0) return;

    Util.addCssToPage(getCss(getNoteColor(settings?.noteColor)));
    this.notes = await this.store.getAll();
    this.targets.forEach((target) => this.render(target));

    // Notes saved in other tabs, on the options page or synced from another browser
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && Object.keys(changes).some(isUserNotesKey)) {
        this.refresh().catch((error) =>
          this.logger.error("Failed to refresh notes:", error)
        );
      }
    });
  }

  private findPostTargets(): NoteTarget[] {
    const targets: NoteTarget[] = [];
    getPosts({ featureName: this.name }).forEach((post) => {
      // Guests and deleted members have no uid to keep a note for
      if (!post.authorUid) return;
      const name = this.querySelector(
        ".author_information .largetext",
        post.el
      );
      if (!name) return;
      const anchor = name.closest("strong") ?? name;
      // HF follows the name with a <br>; put the note below it, not before it,
      // so it doesn't leave an empty line
      const after =
        anchor.nextElementSibling?.tagName === "BR"
          ? anchor.nextElementSibling
          : anchor;
      targets.push(
        this.createTarget(post.authorUid, post.authorName, anchor, after, false)
      );
    });
    return targets;
  }

  private findProfileTargets(): NoteTarget[] {
    const uid = Util.getProfileUserId();
    const name = this.querySelector(
      ".pro-adv-content-info > .pro-adv-card .largetext"
    );
    if (!uid || !name) return [];
    const username = Util.getProfileUsername() ?? "";
    return [this.createTarget(uid, username, name, name, true)];
  }

  private createTarget(
    uid: number,
    username: string,
    anchor: Element,
    after: Element,
    isProfile: boolean
  ): NoteTarget {
    const toggle = el(
      "a",
      { href: "#", class: "hfx-user-note-toggle", role: "button" },
      el("i", { "aria-hidden": "true" })
    );
    const container = el("div", {
      class: `hfx-user-note${isProfile ? " hfx-user-note--profile" : ""}`,
    });
    anchor.after(toggle);
    (after === anchor ? toggle : after).after(container);

    const target: NoteTarget = { uid, username, toggle, container };
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      if (target.editor) {
        this.closeEditor(target);
      } else {
        this.openEditor(target);
      }
    });
    return target;
  }

  /** Re-read notes and update every name not being edited. */
  private async refresh(): Promise<void> {
    this.notes = await this.store.getAll();
    this.targets.forEach((target) => {
      if (!target.editor) this.render(target);
    });
  }

  /** Show a target's note (or nothing) and set its icon. */
  private render(target: NoteTarget): void {
    const note = this.notes.get(target.uid);
    const icon = target.toggle.firstElementChild as HTMLElement;
    icon.className = `${note ? "fas" : "far"} fa-sticky-note`;
    target.toggle.classList.toggle("has-note", !!note);
    target.toggle.title = note ? "Edit your note" : "Add a note";

    target.container.replaceChildren();
    if (note) {
      const text = el(
        "div",
        { class: "hfx-user-note-text", title: "Edit your note" },
        note.note
      );
      text.addEventListener("click", () => this.openEditor(target));
      target.container.appendChild(text);
    }
  }

  private openEditor(target: NoteTarget): void {
    if (target.editor) return;
    const note = this.notes.get(target.uid);

    const textarea = el("textarea", {
      class: "textbox",
      rows: 4,
      maxlength: USER_NOTE_MAX_LENGTH,
      placeholder: "Only you can see this note",
    });
    textarea.value = note?.note ?? "";
    const count = el("span", { class: "hfx-user-note-count" });
    const error = el("div", { class: "hfx-user-note-error" });
    error.hidden = true;
    const updateCount = () => {
      count.textContent = `${textarea.value.length} / ${USER_NOTE_MAX_LENGTH}`;
    };
    updateCount();

    const button = (label: string) =>
      el("button", { type: "button", class: "button" }, label);
    const save = button("Save");
    const remove = note ? button("Delete") : null;
    const cancel = button("Cancel");

    const editor = el("div", { class: "hfx-user-note-editor" }, [
      textarea,
      el("div", { class: "hfx-user-note-editor-footer" }, [
        count,
        save,
        remove,
        cancel,
      ]),
      error,
    ]);

    const run = async (action: () => Promise<string | undefined>) => {
      save.disabled = true;
      error.hidden = true;
      try {
        const message = await action();
        if (message) {
          error.textContent = message;
          error.hidden = false;
          return;
        }
        this.notes = await this.store.getAll();
        this.targets
          .filter((other) => other.uid === target.uid)
          .forEach((other) => {
            this.closeEditor(other);
            this.render(other);
          });
      } catch (caught) {
        this.logger.error("Failed to save note:", caught);
        error.textContent = "Not saved: something went wrong. Try again.";
        error.hidden = false;
      } finally {
        save.disabled = false;
      }
    };
    const saveNote = () =>
      run(async () => {
        const result = await this.store.save(
          target.uid,
          textarea.value,
          target.username
        );
        return result.ok ? undefined : result.error;
      });

    textarea.addEventListener("input", updateCount);
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeEditor(target);
      } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        saveNote();
      }
    });
    save.addEventListener("click", saveNote);
    remove?.addEventListener("click", () =>
      run(async () => {
        await this.store.delete(target.uid);
        return undefined;
      })
    );
    cancel.addEventListener("click", () => this.closeEditor(target));

    target.editor = editor;
    target.container.replaceChildren(editor);
    textarea.focus();
  }

  private closeEditor(target: NoteTarget): void {
    if (!target.editor) return;
    target.editor = undefined;
    this.render(target);
  }
}

export default new UserNotes();
