import { Dropdown } from "../../configuration/configurables/Dropdown";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { SectionArray } from "../../core/SectionArray";
import Popularity from "../../sections/Popularity";

interface PRESET {
  reason: string;
  amount: 1 | 0 | -1; // 1 = positive, 0 = neutral, -1 = negative
}

// Actual amounts are based on the user's available options (1 = highest available value, -1 = lowest)
const PRESETS: PRESET[] = [
  // Positive
  { reason: "A high quality user.", amount: 1 },
  { reason: "I love this member.", amount: 1 },
  { reason: "This member is a great asset to the community.", amount: 1 },
  { reason: "Thank you for the help.", amount: 1 },
  { reason: "Welcome to Hack Forums!", amount: 1 },
  { reason: "Your ass is grass and I'm gonna mow it.", amount: 1 },
  // Neutral
  { reason: "An average user.", amount: 0 },
  { reason: "User smells like cheese.", amount: 0 },
  { reason: "Meh.", amount: 0 },
  { reason: "I dislike this member.", amount: 0 },
  // Negative
  { reason: "A low quality user.", amount: -1 },
  { reason: "I'm breaking up with you.", amount: -1 },
  { reason: "You post trash everywhere.", amount: -1 },
  {
    reason: "Opinions are like assholes, everyone has one. Yours just stinks.",
    amount: -1,
  },
  {
    reason: "Your garden is overgrown and your cucumbers are soft.",
    amount: -1,
  },
  { reason: "You smell like a multi.", amount: -1 },
];

enum REPUTATION_CLASSES {
  POSITIVE = "reputation_positive",
  NEUTRAL = "reputation_neutral",
  NEGATIVE = "reputation_negative",
}

class PopularityPresets extends Feature {
  constructor() {
    // Build default reason options
    const defaultReasonOptions = [];
    const determineLabelPrefix = (value: number) => {
      if (value > 0) return "Positive";
      if (value < 0) return "Negative";
      return "Neutral";
    };
    defaultReasonOptions.push({
      label: "None",
      value: null,
    });
    for (const preset of PRESETS) {
      defaultReasonOptions.push({
        label: `${determineLabelPrefix(preset.amount)}: ${preset.reason}`,
        value: preset.reason,
      });
    }

    super({
      section: Popularity,
      name: "Popularity Presets",
      enabled: true,
      description:
        "Adds a dropdown to the 'give popularity' modal with predefined options.",
      configurables: [
        new Dropdown({
          id: "defaultReason",
          label: "Default Reason",
          description: "The default preset to use when giving popularity.",
          default: null,
          options: defaultReasonOptions,
        }),
        // TODO: add textbox for custom reason
      ],
      additionalSections: new SectionArray(
        new Section(["/showthread.php", "/member.php"])
      ),
    });
  }

  run(_settings: any) {
    const defaultReason = _settings.defaultReason;
    const modalSelector = ".jquery-modal";
    const processedAttr = "data-hfx-popularity-dropdown";

    const handleModal = (modalEl: Element | null) => {
      if (!modalEl) return;
      if ((modalEl as HTMLElement).getAttribute(processedAttr) === "true")
        return;

      this.appendDropdown(modalEl, defaultReason);
      (modalEl as HTMLElement).setAttribute(processedAttr, "true");
    };

    // Handle if already present
    handleModal(document.querySelector(modalSelector));

    // Observe future additions
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const added of Array.from(mutation.addedNodes)) {
          if (!(added instanceof Element)) continue;

          if (added.matches?.(modalSelector)) {
            handleModal(added);
            continue;
          }

          const nested = added.querySelector?.(modalSelector);
          if (nested) {
            handleModal(nested);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private appendDropdown(modalRoot: Element, defaultReason: string | null) {
    // Avoid duplicates
    if (modalRoot.querySelector("select.hfx-popularity-dropdown")) return;

    const findReputationSelect = (): HTMLSelectElement | null => {
      return (modalRoot.querySelector("select#reputation") ||
        modalRoot.querySelector(".modal select#reputation") ||
        modalRoot.querySelector(
          "[class^='reputation_'] select[name='reputation']"
        )) as HTMLSelectElement | null;
    };

    const mountDropdown = (
      reputationSelect: HTMLSelectElement,
      reputationReasonInput: HTMLInputElement,
      maxValue?: string,
      minValue?: string
    ) => {
      const presetDropdown = document.createElement("select");
      presetDropdown.classList.add("hfx-popularity-dropdown");
      presetDropdown.style.marginLeft = "2px";
      presetDropdown.style.maxWidth = "235px";
      presetDropdown.id = "hfx-popularity-dropdown";
      const options = this.createOptions(maxValue, minValue);
      for (const option of options) {
        presetDropdown.appendChild(option);
      }
      presetDropdown.addEventListener("change", (event) => {
        const newValue = (event.target as HTMLSelectElement).value;
        const newReason =
          (event.currentTarget as HTMLSelectElement).selectedOptions[0]?.text ??
          "";
        if (newValue) {
          reputationSelect.value = newValue;
          reputationReasonInput.value = newReason;
        }
      });
      reputationSelect && reputationSelect.after(presetDropdown);
      if (defaultReason) {
        const matchingPreset = PRESETS.find(
          (preset) => preset.reason === defaultReason
        );
        // Only set default if there is no existing value and the preset is found
        if (matchingPreset && !reputationReasonInput.value) {
          let defaultValue = "0";
          if (matchingPreset.amount > 0) {
            defaultValue = maxValue;
          } else if (matchingPreset.amount < 0) {
            defaultValue = minValue;
          } else {
            defaultValue = "0";
          }
          reputationSelect.value = defaultValue;
          reputationReasonInput.value = matchingPreset.reason;
          presetDropdown.selectedIndex = options.findIndex(
            (option) => option.textContent === matchingPreset.reason
          );
        }
      }
    };

    // The modal container may be added before its inner content; observe until select appears
    const innerObserver = new MutationObserver(() => {
      const target = findReputationSelect();
      if (target) {
        const maxValue = target?.options[0].value;
        const minValue = target?.options[target.options.length - 1].value;
        const reputationReasonInput = target
          ?.closest("form")
          ?.querySelector("input[name='comments']") as HTMLInputElement;

        innerObserver.disconnect();
        mountDropdown(target, reputationReasonInput, maxValue, minValue);
      }
    });
    innerObserver.observe(modalRoot, { childList: true, subtree: true });
  }

  private createOptions(maxValue: string, minValue: string) {
    const options = [];
    for (const preset of PRESETS) {
      let option = document.createElement("option");
      if (preset.amount === 0) {
        option.value = "0";
        option.classList.add(REPUTATION_CLASSES.NEUTRAL);
      } else if (preset.amount > 0) {
        option.classList.add(REPUTATION_CLASSES.POSITIVE);
        option.value = maxValue;
      } else if (preset.amount < 0) {
        option.classList.add(REPUTATION_CLASSES.NEGATIVE);
        option.value = minValue;
      }
      option.textContent = preset.reason;
      options.push(option);
    }
    return options;
  }
}

export default new PopularityPresets();
