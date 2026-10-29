import {
  convoNiceTime,
  createTimestamp,
  showsTimestamp,
  TIMESTAMP_CLASS,
} from "./timestamps";

describe("convoNiceTime", () => {
  it("formats like HF's Convo.niceTime, rounded down to the minute", () => {
    const dateline = Math.floor(
      new Date(2026, 9, 20, 18, 2, 45).getTime() / 1000
    );
    const minute = new Date(2026, 9, 20, 18, 2, 0);
    expect(convoNiceTime(dateline)).toBe(
      `${minute.toDateString()}, ${minute.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    );
    expect(convoNiceTime(dateline)).toBe(convoNiceTime(dateline - 45));
    expect(convoNiceTime(dateline)).not.toBe(convoNiceTime(dateline + 15));
  });
});

describe("showsTimestamp", () => {
  it("shows a timestamp unless the sender's next message is in the same minute", () => {
    expect(showsTimestamp("A", null)).toBe(true);
    expect(showsTimestamp("A", undefined)).toBe(true);
    expect(showsTimestamp("A", "B")).toBe(true);
    expect(showsTimestamp("A", "A")).toBe(false);
  });

  it("never shows an empty timestamp", () => {
    expect(showsTimestamp(null, null)).toBe(false);
    expect(showsTimestamp("", null)).toBe(false);
  });
});

describe("createTimestamp", () => {
  it("builds the timestamp line as text", () => {
    const timestamp = createTimestamp("<b>x</b>");
    expect(timestamp.className).toBe(TIMESTAMP_CLASS);
    expect(timestamp.textContent).toBe("<b>x</b>");
    expect(timestamp.children).toHaveLength(0);
    expect(timestamp.style.fontSize).toBe("12px");
  });
});
