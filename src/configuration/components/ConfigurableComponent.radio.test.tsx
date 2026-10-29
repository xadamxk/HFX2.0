import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { RadioGroup } from "../configurables/RadioGroup";
import { ConfigurableComponent } from "./ConfigurableComponent";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const feature = { class: "Test" } as Feature;
const section = {} as Section;

describe("ConfigurableComponent radio group", () => {
  let container: HTMLDivElement;
  let root: Root;

  const side = () =>
    new RadioGroup({
      id: "side",
      label: "Dock side",
      description: "Where it goes.",
      default: "right",
      options: [
        { label: "Right", value: "right" },
        { label: "Left", value: "left" },
      ],
    });

  const render = (featureSettings: object, onChange?: jest.Mock) =>
    act(() =>
      root.render(
        <ConfigurableComponent
          configurable={side()}
          feature={feature}
          section={section}
          featureSettings={featureSettings}
          onChange={onChange}
        />
      )
    );

  const radios = () =>
    Array.from(
      container.querySelectorAll<HTMLInputElement>("input[type=radio]")
    );

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    (console.error as jest.Mock).mockClear();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders one radio per option in a labelled group", () => {
    render({ side: "left" });

    expect(container.querySelector("legend")!.textContent).toBe("Dock side");
    expect(radios().map((radio) => radio.value)).toEqual(["right", "left"]);
    expect(radios().map((radio) => radio.checked)).toEqual([false, true]);
    // All radios share a name, so the browser treats them as one group
    expect(new Set(radios().map((radio) => radio.name)).size).toBe(1);
    expect(container.querySelector(".radio-option--checked")!.textContent).toBe(
      "Left"
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it("checks the default when nothing is saved", () => {
    render({});
    expect(radios().map((radio) => radio.checked)).toEqual([true, false]);
  });

  it("saves the picked option", () => {
    const onChange = jest.fn();
    render({ side: "right" }, onChange);
    act(() => radios()[1].click());
    expect(onChange).toHaveBeenCalledWith("Test", "side", "left");
  });
});
