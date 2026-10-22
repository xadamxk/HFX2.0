import { Configurable, ConfigurableOptions } from "../../core/Configurable";

interface RadioOption {
  label: string;
  value: string;
}

export interface RadioGroupOptions extends ConfigurableOptions {
  options: RadioOption[];
}

/**
 * RadioGroup: pick one of a few options, all visible at once. Prefer it over
 * a Dropdown when there are only a handful of short options.
 * @param options
 * @param options.options - The options to display as radio buttons
 */
export class RadioGroup extends Configurable {
  options: RadioOption[];
  constructor(options: RadioGroupOptions) {
    super(Object.assign(options, { type: "radio" }));
    this.options = options.options;
  }
}
