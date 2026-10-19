import { Configurable, ConfigurableOptions } from "../../core/Configurable";

export interface StepperOptions extends ConfigurableOptions {
  step: number;
}

/**
 * Stepper
 * @param options
 * @param options.step - The amount to increment/decrement the stepper value by
 */
export class Stepper extends Configurable {
  step: number;
  constructor(options: StepperOptions) {
    super(Object.assign(options, { type: "number" }));
    this.step = options.step;
  }
}
