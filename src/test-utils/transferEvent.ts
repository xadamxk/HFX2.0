/** A paste or drop event carrying files (jsdom has no DataTransfer). */
export function transferEvent(
  type: "paste" | "drop" | "dragenter" | "dragover" | "dragleave",
  files: File[],
  init: { relatedTarget?: EventTarget | null } = {}
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const transfer = { files, types: files.length ? ["Files"] : [] };
  Object.defineProperty(
    event,
    type === "paste" ? "clipboardData" : "dataTransfer",
    {
      value: transfer,
    }
  );
  if ("relatedTarget" in init) {
    Object.defineProperty(event, "relatedTarget", {
      value: init.relatedTarget,
    });
  }
  return event;
}

/**
 * Click an attach button and choose `file` in the picker it opens. The picker
 * isn't in the document, so it's caught as it's clicked.
 */
export function chooseFile(button: HTMLElement, file: File): HTMLInputElement {
  let picker: HTMLInputElement | undefined;
  const click = jest
    .spyOn(HTMLInputElement.prototype, "click")
    .mockImplementation(function (this: HTMLInputElement) {
      picker = this;
    });
  try {
    button.click();
  } finally {
    click.mockRestore();
  }
  if (!picker) throw new Error("The button didn't open a file picker");
  Object.defineProperty(picker, "files", { value: [file], configurable: true });
  picker.dispatchEvent(new Event("change"));
  return picker;
}
