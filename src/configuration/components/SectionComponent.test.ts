import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { SectionComponent } from "./SectionComponent";
import { PopupProvider } from "./contexts/PopupContext";
import { TextInput } from "../configurables/TextInput";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// A feature with one text configurable whose value lookup counts renders
const makeFeature = (className: string, name: string) => {
  const configurable = new TextInput({ id: "text", label: "Text", default: "", description: "" });
  const getCurrentValue = jest.spyOn(configurable, "getCurrentValue");
  const feature = {
    class: className,
    name,
    description: "",
    enabled: true,
    configurables: [configurable],
  } as unknown as Feature;
  return { feature, getCurrentValue };
};

const section = { class: "TestSection", name: "Test Section" } as unknown as Section;
const noop = (): void => undefined;

let container: HTMLDivElement;
let root: Root;

const render = (features: Feature[], settings: Record<string, any>) => {
  act(() => {
    root.render(
      React.createElement(
        PopupProvider,
        null,
        React.createElement(SectionComponent, {
          section,
          features,
          settings,
          onFeatureToggle: noop,
          onConfigurableChange: noop,
          onStorageReset: noop,
        })
      )
    );
  });
};

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("SectionComponent", () => {
  it("only re-renders the feature whose settings changed", () => {
    const first = makeFeature("First", "First");
    const second = makeFeature("Second", "Second");
    const features = [first.feature, second.feature];
    const firstSettings = { text: "a" };

    render(features, { First: firstSettings, Second: { text: "b" } });
    first.getCurrentValue.mockClear();
    second.getCurrentValue.mockClear();

    render(features, { First: firstSettings, Second: { text: "c" } });
    expect(first.getCurrentValue).not.toHaveBeenCalled();
    expect(second.getCurrentValue).toHaveBeenCalled();
  });

  it("skips re-rendering when none of its features' settings changed", () => {
    const only = makeFeature("Only", "Only");
    const features = [only.feature];
    const onlySettings = { text: "a" };

    render(features, { Only: onlySettings });
    only.getCurrentValue.mockClear();

    // Another section's feature changed
    render(features, { Only: onlySettings, Elsewhere: { enabled: false } });
    expect(only.getCurrentValue).not.toHaveBeenCalled();
  });

  it("sorts features by name without mutating the prop", () => {
    const zeta = makeFeature("Zeta", "Zeta").feature;
    const alpha = makeFeature("Alpha", "Alpha").feature;
    const features = [zeta, alpha];

    render(features, {});
    const rendered = Array.from(container.querySelectorAll(".feature-item")).map(
      (element) => element.getAttribute("data-feature")
    );
    expect(rendered).toEqual(["Alpha", "Zeta"]);
    expect(features).toEqual([zeta, alpha]);
  });
});
