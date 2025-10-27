import { WrenchIcon } from "@heroicons/react/24/outline";
import { Section } from "../core/Section";

class HFX extends Section {
  constructor() {
    super(["/"], [], WrenchIcon);
    this.class = "HFX";
    this.name = "HFX";
  }
}

export default new HFX();
