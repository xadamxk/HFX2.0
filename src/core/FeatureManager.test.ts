import { Feature } from "./Feature";
import { FeatureManager } from "./FeatureManager";
import { Logger } from "./Logger";
import { Section } from "./Section";
import { STORAGE_KEYS } from "./constants";

const runnableSection = { runnable: () => true } as unknown as Section;

class AsyncFeature extends Feature {
  constructor(name: string, private delayMs: number) {
    super({ id: name, section: runnableSection, name, description: "" });
  }

  async run() {
    this.logger.log("before await");
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    this.logger.log("after await");
  }
}

class ThrowingFeature extends Feature {
  constructor() {
    super({
      id: "Throws",
      section: runnableSection,
      name: "Throws",
      description: "",
    });
  }

  run() {
    throw new Error("boom");
  }
}

class RejectingFeature extends Feature {
  constructor() {
    super({
      id: "Rejects",
      section: runnableSection,
      name: "Rejects",
      description: "",
    });
  }

  async run() {
    await Promise.resolve();
    throw new Error("async boom");
  }
}

class MissingSelectorFeature extends Feature {
  constructor() {
    super({
      id: "Missing",
      section: runnableSection,
      name: "Missing",
      description: "",
    });
  }

  run() {
    this.querySelector(".missing-one");
    this.querySelector(".missing-two");
  }
}

describe("Logger.scope", () => {
  it("buffers entries until flushed, then prints immediately", () => {
    const logger = Logger.scope("Example");
    logger.startBuffering();
    logger.log("buffered");
    expect(console.log).not.toHaveBeenCalled();

    logger.flush("Group");
    expect(console.groupCollapsed).toHaveBeenCalledWith("[GES] Group");
    expect(console.log).toHaveBeenCalledWith("[GES] [Example] buffered");
    expect(console.groupEnd).toHaveBeenCalledTimes(1);

    logger.log("immediate");
    expect(console.log).toHaveBeenLastCalledWith("[GES] [Example] immediate");
  });
});

describe("FeatureManager.loadFeatures", () => {
  let store: { [key: string]: any };

  beforeEach(() => {
    jest.clearAllMocks();
    store = { First: { enabled: true }, Throws: { enabled: true } };
    (chrome.storage.local.get as jest.Mock).mockImplementation(
      (keys: string | string[] | null, callback: (items: any) => void) => {
        const wanted = keys === null ? Object.keys(store) : [keys].flat();
        callback(
          Object.fromEntries(
            wanted.filter((key) => key in store).map((key) => [key, store[key]])
          )
        );
      }
    );
    (chrome.storage.local.set as jest.Mock).mockImplementation(
      (items: { [key: string]: any }, callback: () => void) => {
        Object.assign(store, items);
        callback();
      }
    );
  });

  it("reads all feature settings in one call and groups logs per feature", async () => {
    const first = new AsyncFeature("First", 0);
    const second = new AsyncFeature("Second", 0);
    const throws = new ThrowingFeature();

    await new FeatureManager().loadFeatures([first, second, throws]);

    const settingsReads = (chrome.storage.local.get as jest.Mock).mock.calls
      .map(([keys]) => keys)
      .filter((keys) => Array.isArray(keys));
    expect(settingsReads).toEqual([["First", "Second", "Throws"]]);
    // Second had no stored settings, so its defaults were persisted
    expect(store.Second).toEqual({ enabled: true });

    const consoleOutput = [console.groupCollapsed, console.log, console.error]
      .flatMap((method) => {
        const { calls, invocationCallOrder } = (method as jest.Mock).mock;
        return calls.map(([text], i) => ({ text, order: invocationCallOrder[i] }));
      })
      .sort((a, b) => a.order - b.order)
      .map(({ text }) => text as string);
    const groupedOutput = consoleOutput.filter(
      (text) => text.startsWith("[GES] Feature: ") || text.includes("] [")
    );

    expect(groupedOutput.slice(0, 6)).toEqual([
      "[GES] Feature: First",
      "[GES] [First] before await",
      "[GES] Feature: Second",
      "[GES] [Second] before await",
      "[GES] Feature: Throws",
      "[GES] [Throws] Error loading feature: boom",
    ]);
  });

  it("prints logs from async work after loading with the feature's name", async () => {
    const slow = new AsyncFeature("First", 5);

    await new FeatureManager().loadFeatures([slow]);
    expect(console.log).not.toHaveBeenCalledWith("[GES] [First] after await");

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(console.log).toHaveBeenLastCalledWith("[GES] [First] after await");
  });

  it("logs a rejected async run() and records it in the loading summary", async () => {
    store.Rejects = { enabled: true };
    const manager = new FeatureManager();

    await manager.loadFeatures([new RejectingFeature()]);
    manager.getFeatureReport();

    expect(console.error).toHaveBeenCalledWith(
      "[GES] [Rejects] Error running feature: async boom",
      expect.any(Error)
    );
    expect(console.table).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          feature: "Rejects",
          loaded: true,
          running: true,
          error: "async boom",
        }),
      ],
      expect.any(Array)
    );
  });

  it("saves the page's selector errors in one write after loading", async () => {
    store.Missing = { enabled: true };
    const missing = new MissingSelectorFeature();

    await new FeatureManager().loadFeatures([missing]);

    const errorWrites = (chrome.storage.local.set as jest.Mock).mock.calls
      .map(([items]) => items)
      .filter((items) => STORAGE_KEYS.SELECTOR_MANAGER_ERRORS in items);
    expect(errorWrites).toHaveLength(1);
    expect(
      errorWrites[0][STORAGE_KEYS.SELECTOR_MANAGER_ERRORS].map(
        (e: { selector: string }) => e.selector
      )
    ).toEqual([".missing-one", ".missing-two"]);
  });
});
