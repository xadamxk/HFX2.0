import { UnreadMarker } from "./unreadMarker";

describe("UnreadMarker", () => {
  let list: HTMLElement;
  let marker: UnreadMarker;

  /** A sender group with the given lines, before the jump button. */
  const group = (...texts: string[]) => {
    const root = document.createElement("div");
    root.className = "hfx-gc-group";
    const lines = texts.map((text) => {
      const line = document.createElement("div");
      line.className = "hfx-gc-line";
      line.textContent = text;
      root.appendChild(line);
      return line;
    });
    list.insertBefore(root, marker.jump);
    return { root, lines };
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    list = document.createElement("div");
    document.body.appendChild(list);
    marker = new UnreadMarker(list);
  });

  it("puts the line above the first message missed, until you look", () => {
    const a = group("a1", "a2");
    marker.arrived("a2", a.lines[1], false, true);
    // Mid-group: right above the message
    expect(a.lines[1].previousElementSibling).toBe(marker.divider);

    const b = group("b1");
    marker.arrived("b1", b.lines[0], false, true);
    // Still above the first one missed
    expect(a.lines[1].previousElementSibling).toBe(marker.divider);

    // Focusing the window takes it away; the next one missed brings it back
    marker.looked();
    expect(marker.divider.isConnected).toBe(false);
    marker.arrived("b1", b.lines[0], false, true);
    // Starting a group: above the group
    expect(b.root.previousElementSibling).toBe(marker.divider);
  });

  it("places no line for messages you're looking at, and clears it", () => {
    const a = group("a1");
    marker.arrived("a1", a.lines[0], true, true);
    expect(marker.divider.isConnected).toBe(false);
    marker.arrived("a1", a.lines[0], false, true);
    expect(marker.divider.isConnected).toBe(true);
    marker.clear();
    expect(marker.divider.isConnected).toBe(false);
  });

  it("finds its message again after a redraw, or goes", () => {
    const a = group("a1");
    marker.arrived("a1", a.lines[0], false, true);
    a.root.remove();
    marker.divider.remove();
    const redrawn = group("a1");
    marker.refresh((key) => (key === "a1" ? redrawn.lines[0] : undefined));
    expect(redrawn.root.previousElementSibling).toBe(marker.divider);
    marker.refresh(() => undefined);
    expect(marker.divider.isConnected).toBe(false);
  });

  it("offers a jump down when messages come while scrolled up", () => {
    const a = group("a1");
    marker.arrived("a1", a.lines[0], true, false);
    expect(marker.jump.hidden).toBe(false);
    marker.jump.click();
    expect(marker.jump.hidden).toBe(true);
    marker.arrived("a1", a.lines[0], true, true);
    expect(marker.jump.hidden).toBe(true);
  });
});
