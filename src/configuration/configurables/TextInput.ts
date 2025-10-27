import { ConfigurableOptions } from "../../core/Configurable";
import { Generic } from "./Generic";

/**
 * TextInput
 * @param options
 */
export class TextInput extends Generic {
  constructor(options: ConfigurableOptions) {
    super(Object.assign(options, { type: "text" }));
  }
}
