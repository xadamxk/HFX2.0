import { Configurable, ConfigurableOptions } from "../../core/Configurable";

interface Option {
  label?: string;
  value: string | null;
}

export interface DropdownOptions extends ConfigurableOptions {
  options: Option[];
}

/**
 * Dropdown
 * @param options
 * @param options.options - The options to display in the dropdown
 */
export class Dropdown extends Configurable {
  options: Option[];
  constructor(options: DropdownOptions) {
    super(Object.assign(options, { type: "dropdown" }));
    this.options = options.options;
  }
}
