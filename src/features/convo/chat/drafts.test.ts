import { loadDrafts, saveDrafts } from "./drafts";

describe("drafts", () => {
  const store = () => {
    const items = new Map<string, string>();
    return {
      items,
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
      removeItem: (key: string) => void items.delete(key),
    };
  };

  it("saves non-empty drafts and reads them back", () => {
    const s = store();
    saveDrafts(
      new Map([
        ["dm:500", "hello"],
        ["group:48", "   "],
        ["global", "hi all"],
      ]),
      s
    );
    expect(loadDrafts(s)).toEqual(
      new Map([
        ["dm:500", "hello"],
        ["global", "hi all"],
      ])
    );
    saveDrafts(new Map([["dm:500", ""]]), s);
    expect(s.items.size).toBe(0);
  });

  it("ignores what it can't read or write", () => {
    const s = store();
    s.items.set("hfx-chat-drafts", "not json");
    expect(loadDrafts(s)).toEqual(new Map());
    s.items.set("hfx-chat-drafts", JSON.stringify({ a: 1, b: "kept" }));
    expect(loadDrafts(s)).toEqual(new Map([["b", "kept"]]));
    expect(loadDrafts(null)).toEqual(new Map());
    const full = {
      ...store(),
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => saveDrafts(new Map([["a", "b"]]), full)).not.toThrow();
  });
});
