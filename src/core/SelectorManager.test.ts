import { SelectorErrorRecord, SelectorManager } from "./SelectorManager";
import { StorageService } from "./StorageService";
import { STORAGE_KEYS } from "./constants";
import { MemoryStorage } from "../test-utils/MemoryStorage";

const KEY = STORAGE_KEYS.SELECTOR_MANAGER_ERRORS;

describe("SelectorManager", () => {
  let local: MemoryStorage;
  let manager: SelectorManager;

  const setupStorage = (initial: { [key: string]: any } = {}) => {
    local = new MemoryStorage(initial);
    jest.spyOn(local, "get");
    jest.spyOn(local, "set");
    manager = new SelectorManager(
      new StorageService(local, new MemoryStorage())
    );
  };

  beforeEach(() => {
    document.body.innerHTML = `<div class="present"></div>`;
    setupStorage();
  });

  it("records misses in memory without touching storage", () => {
    manager.query(".missing-one", document, false, "Feature A");
    manager.queryAll(".missing-two", document, false, "Feature B");
    manager.exists(".missing-three", document, false, "Feature C");

    expect(manager.getErrors().map((e) => e.selector)).toEqual([
      ".missing-one",
      ".missing-two",
      ".missing-three",
    ]);
    expect(local.get).not.toHaveBeenCalled();
    expect(local.set).not.toHaveBeenCalled();
  });

  it("does not record optional lookups that find nothing", () => {
    expect(manager.query(".missing", document, true)).toBeNull();
    expect(manager.queryAll(".missing", document, true)).toEqual([]);
    expect(manager.query(".present", document, false)).not.toBeNull();

    expect(manager.getErrors()).toEqual([]);
  });

  it("persists every miss from a page load in a single write", async () => {
    manager.query(".missing-one", document, false, "Feature A");
    manager.query(".missing-two", document, false, "Feature B");
    manager.query(".missing-three", document, false, "Feature C");

    await manager.persistErrors();

    expect(local.set).toHaveBeenCalledTimes(1);
    const saved: SelectorErrorRecord[] = local.items[KEY];
    expect(saved.map((e) => e.selector)).toEqual([
      ".missing-one",
      ".missing-two",
      ".missing-three",
    ]);
  });

  it("only writes errors recorded since the last persist", async () => {
    manager.query(".first", document, false, "Feature A");
    await manager.persistErrors();
    await manager.persistErrors();
    expect(local.set).toHaveBeenCalledTimes(1);

    manager.query(".second", document, false, "Feature A");
    await manager.persistErrors();

    expect(local.set).toHaveBeenCalledTimes(2);
    expect(
      (local.items[KEY] as SelectorErrorRecord[]).map((e) => e.selector)
    ).toEqual([".first", ".second"]);
    // The console summary still covers the whole page
    expect(manager.getErrors()).toHaveLength(2);
  });

  it("keeps earlier records and caps the stored list at 500", async () => {
    const old: SelectorErrorRecord[] = Array.from({ length: 499 }, (_, i) => ({
      selector: `.old-${i}`,
      url: "https://hackforums.net/",
      timestamp: i,
    }));
    setupStorage({ [KEY]: old });

    manager.query(".new-one", document, false);
    manager.query(".new-two", document, false);
    await manager.persistErrors();

    const saved: SelectorErrorRecord[] = local.items[KEY];
    expect(saved).toHaveLength(500);
    expect(saved[0].selector).toBe(".old-1");
    expect(saved.slice(-2).map((e) => e.selector)).toEqual([
      ".new-one",
      ".new-two",
    ]);
  });
});
