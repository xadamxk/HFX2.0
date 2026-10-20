import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { ConfigurableComponent } from "./ConfigurableComponent";
import { SETTING_WRITE_DELAY_MS } from "./useDebouncedSetting";
import { TextInput } from "../configurables/TextInput";
import { ColorPicker } from "../configurables/ColorPicker";
import { Stepper } from "../configurables/Stepper";
import { Configurable } from "../../core/Configurable";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const feature = { class: "TestFeature", name: "Test Feature" } as unknown as Feature;
const section = {} as Section;

let container: HTMLDivElement;
let root: Root;

const render = (
  configurable: Configurable,
  onChange: jest.Mock,
  featureSettings?: Record<string, unknown>
) => {
  act(() => {
    root.render(
      React.createElement(ConfigurableComponent, {
        configurable,
        feature,
        section,
        featureSettings,
        onChange,
      })
    );
  });
};

// React tracks controlled input values, so set it through the native setter
const typeInto = (input: HTMLInputElement, value: string) => {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

const blur = (input: HTMLInputElement) => {
  act(() => {
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  });
};

const advance = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

const getInput = () => container.querySelector("input") as HTMLInputElement;

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

describe("TextInput", () => {
  const textInput = () =>
    new TextInput({ id: "greeting", label: "Greeting", default: "", description: "" });

  it("saves once, after typing pauses, with the last value", () => {
    const onChange = jest.fn();
    render(textInput(), onChange);

    typeInto(getInput(), "h");
    typeInto(getInput(), "he");
    typeInto(getInput(), "hey");
    expect(getInput().value).toBe("hey");
    expect(onChange).not.toHaveBeenCalled();

    advance(SETTING_WRITE_DELAY_MS - 1);
    expect(onChange).not.toHaveBeenCalled();

    advance(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("TestFeature", "greeting", "hey");
  });

  it("saves the pending edit right away on blur", () => {
    const onChange = jest.fn();
    render(textInput(), onChange);

    typeInto(getInput(), "hi");
    blur(getInput());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("TestFeature", "greeting", "hi");

    // Nothing left to save when the timer would have fired
    advance(SETTING_WRITE_DELAY_MS);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("saves the pending edit on unmount", () => {
    const onChange = jest.fn();
    render(textInput(), onChange);

    typeInto(getInput(), "bye");
    act(() => root.render(null));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("TestFeature", "greeting", "bye");
  });

  it("saves the pending edit when the page is hidden", () => {
    const onChange = jest.fn();
    render(textInput(), onChange);

    typeInto(getInput(), "closing");
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(onChange).toHaveBeenCalledWith("TestFeature", "greeting", "closing");
  });

  it("skips the write when edits end back on the saved value", () => {
    const onChange = jest.fn();
    render(textInput(), onChange, { greeting: "same" });

    typeInto(getInput(), "sam");
    typeInto(getInput(), "same");
    advance(SETTING_WRITE_DELAY_MS);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows outside changes to the saved value", () => {
    const onChange = jest.fn();
    const configurable = textInput();
    render(configurable, onChange, { greeting: "old" });
    expect(getInput().value).toBe("old");

    render(configurable, onChange, { greeting: "new" });
    expect(getInput().value).toBe("new");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ColorPicker", () => {
  it("saves once after dragging through several colors", () => {
    const onChange = jest.fn();
    render(
      new ColorPicker({ id: "color", label: "Color", default: "#000000", description: "" }),
      onChange
    );

    typeInto(getInput(), "#111111");
    typeInto(getInput(), "#222222");
    typeInto(getInput(), "#333333");
    advance(SETTING_WRITE_DELAY_MS);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("TestFeature", "color", "#333333");
  });
});

describe("Stepper", () => {
  const stepper = () =>
    new Stepper({ id: "count", label: "Count", default: 5, description: "", step: 2 });

  it("saves once after several button clicks", () => {
    const onChange = jest.fn();
    render(stepper(), onChange);

    const increase = container.querySelector(".stepper-increase") as HTMLButtonElement;
    act(() => increase.click());
    act(() => increase.click());
    act(() => increase.click());
    expect(getInput().value).toBe("11");
    expect(onChange).not.toHaveBeenCalled();

    advance(SETTING_WRITE_DELAY_MS);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("TestFeature", "count", 11);
  });

  it("saves typed numbers on blur", () => {
    const onChange = jest.fn();
    render(stepper(), onChange);

    typeInto(getInput(), "42");
    blur(getInput());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("TestFeature", "count", 42);
  });
});
