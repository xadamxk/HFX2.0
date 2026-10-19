import PopularityPresets from "./PopularityPresets";

const FORM_HTML = `
  <form>
    <select id="reputation" name="reputation">
      <option value="3">+3</option>
      <option value="0">0</option>
      <option value="-3">-3</option>
    </select>
    <input name="comments" value="" />
  </form>`;

// MutationObserver callbacks run as microtasks
const flushObservers = () => new Promise((resolve) => setTimeout(resolve, 0));

const addModal = (innerHtml: string) => {
  const modal = document.createElement("div");
  modal.className = "jquery-modal blocker";
  modal.innerHTML = innerHtml;
  document.body.appendChild(modal);
  return modal;
};

describe("PopularityPresets", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("adds the dropdown to a modal that arrives fully rendered", async () => {
    PopularityPresets.run({ defaultReason: null });

    const modal = addModal(FORM_HTML);
    await flushObservers();

    expect(modal.querySelector("select.hfx-popularity-dropdown")).not.toBeNull();
  });

  it("adds the dropdown when the modal content loads after the container", async () => {
    PopularityPresets.run({ defaultReason: null });

    const modal = addModal("");
    await flushObservers();
    expect(modal.querySelector("select.hfx-popularity-dropdown")).toBeNull();

    modal.innerHTML = FORM_HTML;
    await flushObservers();

    expect(modal.querySelectorAll("select.hfx-popularity-dropdown")).toHaveLength(1);
  });

  it("handles a modal already on the page and applies the default reason", () => {
    const modal = addModal(FORM_HTML);

    PopularityPresets.run({ defaultReason: "Thank you for the help." });

    const reputation = modal.querySelector<HTMLSelectElement>("#reputation")!;
    const comments = modal.querySelector<HTMLInputElement>("input[name='comments']")!;
    expect(modal.querySelector("select.hfx-popularity-dropdown")).not.toBeNull();
    expect(reputation.value).toBe("3");
    expect(comments.value).toBe("Thank you for the help.");
  });

  it("picks a preset's reason and amount when chosen from the dropdown", () => {
    const modal = addModal(FORM_HTML);
    PopularityPresets.run({ defaultReason: null });

    const presets = modal.querySelector<HTMLSelectElement>(".hfx-popularity-dropdown")!;
    const negative = Array.from(presets.options).findIndex(
      (option) => option.textContent === "A low quality user."
    );
    presets.selectedIndex = negative;
    presets.dispatchEvent(new Event("change"));

    expect(modal.querySelector<HTMLSelectElement>("#reputation")!.value).toBe("-3");
    expect(modal.querySelector<HTMLInputElement>("input[name='comments']")!.value).toBe(
      "A low quality user."
    );
  });
});
