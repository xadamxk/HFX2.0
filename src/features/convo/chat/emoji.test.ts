import {
  EmojiPicker,
  insertAtCaret,
  loadRecentEmoji,
  rememberEmoji,
} from "./emoji";

const memoryStore = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
    key: () => null,
    length: 0,
  } as Storage;
};

describe("insertAtCaret", () => {
  it("types at the caret, replacing a selection, and fires input", () => {
    const input = document.createElement("textarea");
    document.body.appendChild(input);
    const onInput = jest.fn();
    input.addEventListener("input", onInput);
    input.value = "hi there";
    input.setSelectionRange(2, 2);
    insertAtCaret(input, " 👋");
    expect(input.value).toBe("hi 👋 there");
    expect(input.selectionStart).toBe(2 + " 👋".length);
    input.setSelectionRange(0, 2);
    insertAtCaret(input, "yo");
    expect(input.value).toBe("yo 👋 there");
    expect(onInput).toHaveBeenCalledTimes(2);
  });
});

describe("recent emoji", () => {
  it("keeps the latest first, without repeats, up to 16", () => {
    const store = memoryStore();
    expect(loadRecentEmoji(store)).toEqual([]);
    rememberEmoji("😀", store);
    rememberEmoji("🔥", store);
    rememberEmoji("😀", store);
    expect(loadRecentEmoji(store)).toEqual(["😀", "🔥"]);
    for (let i = 0; i < 20; i++) rememberEmoji(String(i), store);
    expect(loadRecentEmoji(store)).toHaveLength(16);
    store.setItem("hfx-chat-emoji-recent", "not json");
    expect(loadRecentEmoji(store)).toEqual([]);
  });
});

describe("EmojiPicker", () => {
  let input: HTMLTextAreaElement;
  let compose: HTMLElement;
  let picker: EmojiPicker;
  let store: Storage;

  const options = () =>
    Array.from(
      picker.panel.querySelectorAll<HTMLButtonElement>(".hfx-chat-emoji-option")
    );
  const labels = () =>
    Array.from(picker.panel.querySelectorAll(".hfx-chat-emoji-label")).map(
      (label) => label.textContent
    );

  beforeEach(() => {
    document.body.innerHTML = "";
    compose = document.createElement("div");
    input = document.createElement("textarea");
    compose.appendChild(input);
    document.body.appendChild(compose);
    store = memoryStore();
    picker = new EmojiPicker(input, compose, store);
  });

  afterEach(() => picker.close());

  it("opens a grid from the button and types the emoji picked, staying open", () => {
    expect(compose.contains(picker.button)).toBe(true);
    picker.button.click();
    expect(picker.isOpen).toBe(true);
    expect(picker.button.getAttribute("aria-expanded")).toBe("true");
    expect(labels()).toEqual([
      "Smileys",
      "Gestures",
      "Hearts & symbols",
      "Things",
    ]);
    input.value = "nice ";
    input.setSelectionRange(5, 5);
    options()
      .find((o) => o.textContent === "🔥")!
      .click();
    expect(input.value).toBe("nice 🔥");
    expect(picker.isOpen).toBe(true);

    // Used ones come first next time
    picker.close();
    picker.button.click();
    expect(labels()[0]).toBe("Recent");
    expect(options()[0].textContent).toBe("🔥");
  });

  it("closes on Esc before anything else sees it, on the button, or a click elsewhere", () => {
    const onKey = jest.fn();
    input.addEventListener("keydown", onKey);
    picker.button.click();
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      })
    );
    expect(picker.isOpen).toBe(false);
    expect(onKey).not.toHaveBeenCalled();

    picker.button.click();
    picker.button.click();
    expect(picker.isOpen).toBe(false);

    picker.button.click();
    options()[0].dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(picker.isOpen).toBe(true);
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(picker.isOpen).toBe(false);
  });
});
