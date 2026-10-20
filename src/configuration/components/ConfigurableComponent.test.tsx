import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { Dropdown } from "../configurables/Dropdown";
import { ConfigurableComponent } from "./ConfigurableComponent";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const feature = { class: "Test" } as Feature;
const section = {} as Section;

describe("ConfigurableComponent dropdown", () => {
  let container: HTMLDivElement;
  let root: Root;

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

  it("renders a null-valued option without React warnings", () => {
    const dropdown = new Dropdown({
      id: "choice",
      label: "Choice",
      description: "",
      default: null,
      options: [
        { label: "None", value: null },
        { label: "First", value: "first" },
      ],
    });

    act(() =>
      root.render(
        <ConfigurableComponent
          configurable={dropdown}
          feature={feature}
          section={section}
          settings={{ Test: { choice: "first" } }}
        />
      )
    );

    const options = container.querySelectorAll("option");
    expect(options).toHaveLength(2);
    // A null value leaves the attribute off, so the option's value is its text
    expect(options[0].hasAttribute("value")).toBe(false);
    expect(options[0].value).toBe("None");
    expect(container.querySelector("select")!.value).toBe("first");
    // React warnings reach console.error (see setup-tests.ts); expect none
    expect(console.error).not.toHaveBeenCalled();
  });
});
