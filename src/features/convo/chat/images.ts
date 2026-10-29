/**
 * Image uploads, with the same rules and messages as HF's own Convo
 * (convo_1d.js handleFileUpload): PNG, JPG or GIF, at most 3,000,000 bytes,
 * sent as raw bytes with convo_imageupload.
 */

export const MAX_IMAGE_BYTES = 3000000;

/** HF's confirmation before uploading a pasted image. */
export const PASTE_CONFIRM = "Do you want to upload this image?";

/** Why HF would refuse this file, or null if it can be uploaded. */
export function imageUploadError(file: {
  size: number;
  type: string;
}): string | null {
  if (file.size > MAX_IMAGE_BYTES) return "Images cannot exceed 3MB in size.";
  if (
    !["image/gif", "image/jpeg", "image/png"].some((type) =>
      file.type.includes(type)
    )
  ) {
    return "Invalid image type. Please use PNG, GIF, or JPG format.";
  }
  return null;
}

/** The first file in a paste or drop, if there is one. */
export function firstFile(transfer: DataTransfer | null): File | null {
  return transfer?.files?.length ? transfer.files[0] : null;
}

const hasFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

/**
 * Take images the way HF's Convo does: pasting a file asks first
 * (PASTE_CONFIRM), dropping one uploads it. While a file is dragged over the
 * window it gets `hfx-chat-dropping`, which shows a drop hint.
 */
export function acceptImages(
  root: HTMLElement,
  onFile: (file: File) => void,
  confirmPaste: (message: string) => boolean = (message) =>
    window.confirm(message)
): void {
  root.addEventListener("paste", (event) => {
    const file = firstFile(event.clipboardData);
    if (file && confirmPaste(PASTE_CONFIRM)) {
      event.preventDefault();
      onFile(file);
    }
  });
  const over = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    root.classList.add("hfx-chat-dropping");
  };
  root.addEventListener("dragenter", over);
  root.addEventListener("dragover", over);
  root.addEventListener("dragleave", (event) => {
    if (!root.contains(event.relatedTarget as Node | null)) {
      root.classList.remove("hfx-chat-dropping");
    }
  });
  root.addEventListener("drop", (event) => {
    root.classList.remove("hfx-chat-dropping");
    const file = firstFile(event.dataTransfer);
    if (!file) return;
    event.preventDefault();
    event.stopPropagation();
    onFile(file);
  });
}

/** The image types HF takes, for the file picker. */
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/gif";

const plusIcon = (): SVGSVGElement => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", "M12 5v14M5 12h14");
  svg.appendChild(path);
  return svg;
};

/**
 * A plus button that opens a file picker for one image and hands the chosen
 * file to onFile, which runs the same checks as a paste or drop.
 */
export function attachButton(onFile: (file: File) => void): HTMLButtonElement {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = IMAGE_ACCEPT;
  picker.addEventListener("change", () => {
    const file = picker.files?.[0];
    // Cleared so picking the same file again still fires change
    picker.value = "";
    if (file) onFile(file);
  });
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hfx-chat-attach";
  button.title = "Attach an image";
  button.setAttribute("aria-label", "Attach an image");
  button.appendChild(plusIcon());
  button.addEventListener("click", () => picker.click());
  return button;
}

/** A file's bytes. Blob.arrayBuffer() where available, FileReader otherwise. */
export function readBytes(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(reader.error ?? new Error("Couldn't read the image."));
    reader.readAsArrayBuffer(file);
  });
}
