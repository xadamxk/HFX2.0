import { ConfigurableOptions } from "../../core/Configurable";
import { Generic } from "./Generic";

/**
 * ColorPicker
 * @param options
 */
export class ColorPicker extends Generic {
  constructor(options: ConfigurableOptions) {
    super(Object.assign(options, { type: "color" }));
  }
}
