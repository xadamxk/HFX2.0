import { Configurable, ConfigurableOptions } from "../../core/Configurable";

export class Checkbox extends Configurable {
  constructor(options: ConfigurableOptions) {
    super(Object.assign(options, { type: "checkbox" }));
  }
}
