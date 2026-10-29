import {
  acceptImages,
  attachButton,
  IMAGE_ACCEPT,
  imageUploadError,
  MAX_IMAGE_BYTES,
  PASTE_CONFIRM,
  readBytes,
} from "./images";
import { chooseFile, transferEvent } from "../../../test-utils/transferEvent";

const png = (bytes = [137, 80, 78, 71]) =>
  new File([new Uint8Array(bytes)], "shot.png", { type: "image/png" });

describe("imageUploadError", () => {
  it("allows PNG, JPG and GIF up to 3,000,000 bytes, like HF", () => {
    for (const type of ["image/png", "image/jpeg", "image/gif"]) {
      expect(imageUploadError({ size: MAX_IMAGE_BYTES, type })).toBeNull();
    }
  });

  it("uses HF's messages for big or other files", () => {
    expect(
      imageUploadError({ size: MAX_IMAGE_BYTES + 1, type: "image/png" })
    ).toBe("Images cannot exceed 3MB in size.");
    expect(imageUploadError({ size: 10, type: "image/webp" })).toBe(
      "Invalid image type. Please use PNG, GIF, or JPG format."
    );
    expect(imageUploadError({ size: 10, type: "" })).not.toBeNull();
  });
});

describe("readBytes", () => {
  it("reads a file's bytes", async () => {
    const bytes = new Uint8Array(await readBytes(png([1, 2, 3])));
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });
});

describe("acceptImages", () => {
  let root: HTMLElement;
  let onFile: jest.Mock;
  let confirm: jest.Mock;

  beforeEach(() => {
    root = document.createElement("section");
    document.body.appendChild(root);
    onFile = jest.fn();
    confirm = jest.fn(() => true);
    acceptImages(root, onFile, confirm);
  });

  afterEach(() => root.remove());

  it("asks before uploading a pasted image, like HF", () => {
    const file = png();
    const event = transferEvent("paste", [file]);
    root.dispatchEvent(event);
    expect(confirm).toHaveBeenCalledWith(PASTE_CONFIRM);
    expect(onFile).toHaveBeenCalledWith(file);
    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves the paste alone when declined", () => {
    confirm.mockReturnValue(false);
    const event = transferEvent("paste", [png()]);
    root.dispatchEvent(event);
    expect(onFile).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores pasted text", () => {
    root.dispatchEvent(transferEvent("paste", []));
    expect(confirm).not.toHaveBeenCalled();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("uploads a dropped image without asking, showing a hint while dragging", () => {
    root.dispatchEvent(transferEvent("dragenter", [png()]));
    expect(root.classList).toContain("hfx-chat-dropping");
    root.dispatchEvent(
      transferEvent("dragleave", [png()], { relatedTarget: document.body })
    );
    expect(root.classList).not.toContain("hfx-chat-dropping");

    root.dispatchEvent(transferEvent("dragover", [png()]));
    const file = png();
    const drop = transferEvent("drop", [file]);
    root.dispatchEvent(drop);
    expect(onFile).toHaveBeenCalledWith(file);
    expect(confirm).not.toHaveBeenCalled();
    expect(drop.defaultPrevented).toBe(true);
    expect(root.classList).not.toContain("hfx-chat-dropping");
  });
});

describe("attachButton", () => {
  it("is a labelled plus button", () => {
    const button = attachButton(jest.fn());
    expect(button.type).toBe("button");
    expect(button.getAttribute("aria-label")).toBe("Attach an image");
    expect(button.querySelector("svg path")!.getAttribute("d")).toBe(
      "M12 5v14M5 12h14"
    );
  });

  it("opens a picker for HF's image types and hands over the chosen file", () => {
    const onFile = jest.fn();
    const button = attachButton(onFile);
    const file = png();
    const picker = chooseFile(button, file);
    expect(picker.type).toBe("file");
    expect(picker.accept).toBe(IMAGE_ACCEPT);
    expect(picker.multiple).toBe(false);
    expect(onFile).toHaveBeenCalledWith(file);
    // Cleared, so choosing the same file again still uploads it
    expect(picker.value).toBe("");
  });

  it("does nothing when the picker is cancelled", () => {
    const onFile = jest.fn();
    const button = attachButton(onFile);
    let picker!: HTMLInputElement;
    const click = jest
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(function (this: HTMLInputElement) {
        picker = this;
      });
    button.click();
    click.mockRestore();
    picker.dispatchEvent(new Event("change"));
    expect(onFile).not.toHaveBeenCalled();
  });
});
