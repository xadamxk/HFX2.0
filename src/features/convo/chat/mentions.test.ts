import type { ChatUser } from "./ConvoClient";
import {
  applyMention,
  matchMembers,
  MentionPicker,
  mentionQuery,
} from "./mentions";

const user = (uid: number, username: string, group?: number): ChatUser => ({
  uid,
  username,
  avatar: "",
  lastActive: 0,
  group,
});
const NOVA = user(20, "Nova", 46);
const NOVEMBER = user(21, "November Rain");
const ORBIT = user(30, "Orbit");
const SUPERNOVA = user(40, "SuperNova");
const MEMBERS = [NOVA, NOVEMBER, ORBIT, SUPERNOVA];

describe("mentionQuery", () => {
  it("finds an @ at the start or after a space, up to the caret", () => {
    expect(mentionQuery("@", 1)).toEqual({ start: 0, query: "" });
    expect(mentionQuery("hi @No", 6)).toEqual({ start: 3, query: "No" });
    expect(mentionQuery("hi\n@No", 6)).toEqual({ start: 3, query: "No" });
    // The caret can be mid-text: only what's before it counts
    expect(mentionQuery("hi @No there", 6)).toEqual({ start: 3, query: "No" });
    // Names can have spaces
    expect(mentionQuery("@November R", 11)).toEqual({
      start: 0,
      query: "November R",
    });
  });

  it("ignores emails, finished mentions and @s on an earlier line", () => {
    expect(mentionQuery("me@hf.net", 9)).toBeNull();
    expect(mentionQuery("@Nova@ ", 7)).toBeNull();
    expect(mentionQuery("@Nova@ hi", 9)).toBeNull();
    expect(mentionQuery("@No\nhi", 6)).toBeNull();
    expect(mentionQuery("no at sign", 10)).toBeNull();
    expect(mentionQuery(`@${"x".repeat(31)}`, 32)).toBeNull();
  });
});

describe("matchMembers", () => {
  it("puts names starting with the query first, then names containing it", () => {
    expect(matchMembers(MEMBERS, "nov")).toEqual([NOVA, NOVEMBER, SUPERNOVA]);
    expect(matchMembers(MEMBERS, "NOVA")).toEqual([NOVA, SUPERNOVA]);
    expect(matchMembers(MEMBERS, "november r")).toEqual([NOVEMBER]);
  });

  it("offers everyone for a bare @, up to the limit", () => {
    expect(matchMembers(MEMBERS, "")).toEqual(MEMBERS);
    expect(matchMembers(MEMBERS, "", 2)).toEqual([NOVA, NOVEMBER]);
  });

  it("offers no one after '@ ' or for no match", () => {
    expect(matchMembers(MEMBERS, " nova")).toEqual([]);
    expect(matchMembers(MEMBERS, "zzz")).toEqual([]);
  });
});

describe("applyMention", () => {
  it("writes @username@ and a space, with the caret after the space", () => {
    expect(
      applyMention("hi @no", { start: 3, query: "no" }, 6, "Nova")
    ).toEqual({ value: "hi @Nova@ ", caret: 10 });
  });

  it("keeps the text after the caret, without doubling a space", () => {
    expect(
      applyMention("@no there", { start: 0, query: "no" }, 3, "Nova")
    ).toEqual({ value: "@Nova@ there", caret: 7 });
    expect(
      applyMention("@nothere", { start: 0, query: "no" }, 3, "Nova")
    ).toEqual({ value: "@Nova@ there", caret: 7 });
  });
});

describe("MentionPicker", () => {
  let input: HTMLTextAreaElement;
  let picker: MentionPicker;
  let onInsert: jest.Mock;

  const type = (value: string) => {
    input.value = value;
    input.setSelectionRange(value.length, value.length);
    input.dispatchEvent(new Event("input"));
  };
  const key = (name: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent("keydown", {
      key: name,
      cancelable: true,
      ...init,
    });
    return { used: picker.handleKey(event), event };
  };
  const options = () =>
    Array.from(picker.root.querySelectorAll('[role="option"]')).map(
      (option) => option.textContent
    );
  const active = () =>
    picker.root.querySelector('[aria-selected="true"]')?.textContent;

  beforeEach(() => {
    document.body.innerHTML = "";
    input = document.createElement("textarea");
    onInsert = jest.fn();
    picker = new MentionPicker(
      input,
      () => MEMBERS,
      "https://hackforums.net",
      onInsert
    );
    document.body.append(picker.root, input);
    input.focus();
  });

  it("opens on @ and filters as you type", () => {
    expect(picker.isOpen).toBe(false);
    type("hey @");
    expect(picker.isOpen).toBe(true);
    expect(options()).toEqual(["Nova", "November Rain", "Orbit", "SuperNova"]);
    type("hey @orb");
    expect(options()).toEqual(["Orbit"]);
    type("hey @zzz");
    expect(picker.isOpen).toBe(false);
  });

  it("shows names in their HF group style", () => {
    type("@nova");
    expect(picker.root.querySelector('[role="option"] span')!.className).toBe(
      "group46"
    );
  });

  it("moves with the arrow keys, wrapping around", () => {
    type("@nov");
    expect(active()).toBe("Nova");
    key("ArrowDown");
    expect(active()).toBe("November Rain");
    key("ArrowUp");
    key("ArrowUp");
    expect(active()).toBe("SuperNova");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      picker.root.querySelector('[aria-selected="true"]')!.id
    );
  });

  it("inserts the highlighted member on Enter or Tab", () => {
    type("hi @nov");
    key("ArrowDown");
    const { used, event } = key("Enter");
    expect(used).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(input.value).toBe("hi @November Rain@ ");
    expect(input.selectionStart).toBe(input.value.length);
    expect(picker.isOpen).toBe(false);
    expect(onInsert).toHaveBeenCalledTimes(1);

    type("@orb");
    key("Tab");
    expect(input.value).toBe("@Orbit@ ");
  });

  it("inserts a clicked member", () => {
    type("@");
    (picker.root.querySelectorAll('[role="option"]')[2] as HTMLElement).click();
    expect(input.value).toBe("@Orbit@ ");
  });

  it("leaves keys alone when closed, and closes on Escape", () => {
    type("hello");
    expect(key("Enter").used).toBe(false);
    type("@");
    expect(key("Escape").used).toBe(true);
    expect(picker.isOpen).toBe(false);
    expect(key("Enter").used).toBe(false);
    // Shift+Enter is still a new line
    type("@");
    expect(key("Enter", { shiftKey: true }).used).toBe(false);
  });

  it("closes when the input loses focus", () => {
    type("@");
    input.dispatchEvent(new Event("blur"));
    expect(picker.isOpen).toBe(false);
  });
});
