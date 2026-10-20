import { Feature } from "./Feature";
import { Section } from "./Section";

const sectionReturning = (runnable: boolean) =>
  ({ runnable: jest.fn(() => runnable) }) as unknown as Section;

const makeFeature = (section: Section) => {
  const feature = new Feature({
    id: "Test",
    section,
    name: "Test Feature",
    description: "",
  });
  const run = jest.spyOn(feature, "run").mockReturnValue(undefined);
  return { feature, run };
};

describe("Feature.start", () => {
  afterEach(() => {
    (globalThis as any).__HFX_DEV__ = true;
  });

  it("uses the id, not the name, as its settings key", () => {
    const { feature } = makeFeature(sectionReturning(true));
    expect(feature.id).toBe("Test");
    expect(feature.class).toBe("Test");
  });

  it("checks the section once and passes it to run()", () => {
    const section = sectionReturning(true);
    const { feature, run } = makeFeature(section);

    expect(feature.start({ enabled: true })).toBe(true);
    expect(section.runnable).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith({ enabled: true }, section);
  });

  it("does not run when disabled or on another page", () => {
    const disabled = makeFeature(sectionReturning(true));
    expect(disabled.feature.start({ enabled: false })).toBe(false);
    expect(disabled.run).not.toHaveBeenCalled();

    const elsewhere = makeFeature(sectionReturning(false));
    expect(elsewhere.feature.start({ enabled: true })).toBe(false);
    expect(elsewhere.run).not.toHaveBeenCalled();
  });

  it("only serializes settings for debug logging in development builds", () => {
    const settings = { enabled: false, toJSON: jest.fn(() => ({})) };
    const { feature } = makeFeature(sectionReturning(true));

    (globalThis as any).__HFX_DEV__ = false;
    feature.start(settings);
    expect(settings.toJSON).not.toHaveBeenCalled();

    (globalThis as any).__HFX_DEV__ = true;
    feature.start(settings);
    expect(settings.toJSON).toHaveBeenCalled();
  });

  it("reports a rejected async run() to the caller", async () => {
    const { feature, run } = makeFeature(sectionReturning(true));
    const error = new Error("async boom");
    run.mockReturnValue(Promise.reject(error));
    const onAsyncError = jest.fn();

    feature.start({ enabled: true }, onAsyncError);
    await Promise.resolve();

    expect(onAsyncError).toHaveBeenCalledWith(error);
  });
});
