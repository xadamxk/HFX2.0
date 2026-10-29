import { el, ElChild } from "../../../core/Dom";

/**
 * A list shown above a compose box while something is typed that it can
 * complete: members after @, commands after / (see MentionPicker and
 * CommandPicker). Arrow keys or the mouse pick an option, Enter or Tab
 * inserts it, and Escape closes the list.
 */

/** What's being typed at the caret that the list completes. */
export interface Token {
  /** Where it starts (the @ or /). */
  start: number;
  /** What's typed after that, up to the caret. */
  query: string;
}

export interface SuggestionSource<T> {
  /** The list's accessible name. */
  label: string;
  /** Class for each option, beside hfx-gc-suggestion. */
  optionClass: string;
  /** The token at the caret, or null when there's nothing to complete. */
  find(value: string, caret: number): Token | null;
  /** The options for what's typed, best first. */
  match(query: string): T[];
  /** The input's text with the token replaced by the option, and where the caret goes. */
  apply(
    value: string,
    token: Token,
    caret: number,
    option: T
  ): { value: string; caret: number };
  render(option: T): ElChild[];
  /**
   * Whether Enter should go to the input (e.g. to send) instead of picking,
   * when this option is highlighted.
   */
  enterSends?(option: T, token: Token): boolean;
}

let pickerCount = 0;

export class SuggestionPicker<T> {
  readonly root: HTMLElement;
  private readonly id = `hfx-suggestions-${++pickerCount}`;
  private token: Token | null = null;
  private matches: T[] = [];
  private active = 0;

  constructor(
    private readonly input: HTMLTextAreaElement,
    private readonly source: SuggestionSource<T>,
    /** The input's text changed by picking an option. */
    private readonly onInsert: () => void
  ) {
    this.root = el("div", {
      class: "hfx-gc-mentions",
      id: this.id,
      role: "listbox",
      "aria-label": source.label,
      hidden: true,
    });
    input.setAttribute("aria-autocomplete", "list");
    input.addEventListener("input", () => this.update());
    input.addEventListener("click", () => this.update());
    input.addEventListener("keyup", (event) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        this.update();
    });
    input.addEventListener("blur", () => this.close());
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /** Open, filter or close the list for what's at the caret. */
  update(): void {
    const { selectionStart, selectionEnd, value } = this.input;
    this.token =
      selectionStart === selectionEnd
        ? this.source.find(value, selectionStart)
        : null;
    this.matches = this.token ? this.source.match(this.token.query) : [];
    this.active = 0;
    this.render();
  }

  /** Handle a key while the list is open; returns whether it was used. */
  handleKey(event: KeyboardEvent): boolean {
    if (!this.isOpen || event.isComposing) return false;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        const step = event.key === "ArrowDown" ? 1 : -1;
        const count = this.matches.length;
        this.active = (this.active + step + count) % count;
        this.render();
        break;
      }
      case "Enter":
      case "Tab": {
        if (event.shiftKey) return false;
        const option = this.matches[this.active];
        if (
          event.key === "Enter" &&
          this.token &&
          this.source.enterSends?.(option, this.token)
        ) {
          this.close();
          return false;
        }
        this.pick(option);
        break;
      }
      case "Escape":
        event.stopPropagation();
        this.close();
        break;
      default:
        return false;
    }
    event.preventDefault();
    return true;
  }

  close(): void {
    this.token = null;
    this.matches = [];
    this.render();
  }

  private pick(option: T): void {
    if (!this.token) return;
    const result = this.source.apply(
      this.input.value,
      this.token,
      this.input.selectionStart,
      option
    );
    this.input.value = result.value;
    this.input.focus();
    this.input.setSelectionRange(result.caret, result.caret);
    this.close();
    this.onInsert();
  }

  private render(): void {
    const open = this.matches.length > 0;
    this.root.hidden = !open;
    if (!open) {
      this.root.replaceChildren();
      // An input can have more than one list: only undo what this one set
      const controls = this.input.getAttribute("aria-controls");
      if (controls === this.id) {
        this.input.removeAttribute("aria-controls");
        this.input.removeAttribute("aria-activedescendant");
      }
      if (!controls || controls === this.id)
        this.input.setAttribute("aria-expanded", "false");
      return;
    }
    this.input.setAttribute("aria-expanded", "true");
    this.input.setAttribute("aria-controls", this.id);
    const rows = this.matches.map((option, index) => {
      const selected = index === this.active;
      const row = el(
        "div",
        {
          class: `hfx-gc-suggestion ${this.source.optionClass}${selected ? " hfx-gc-mention-active" : ""}`,
          id: `${this.id}-${index}`,
          role: "option",
          "aria-selected": String(selected),
        },
        this.source.render(option)
      );
      // Keep focus (and the caret) in the input
      row.addEventListener("mousedown", (event) => event.preventDefault());
      row.addEventListener("click", () => this.pick(option));
      return row;
    });
    this.root.replaceChildren(...rows);
    this.input.setAttribute(
      "aria-activedescendant",
      `${this.id}-${this.active}`
    );
    rows[this.active].scrollIntoView?.({ block: "nearest" });
  }
}
