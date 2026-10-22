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
