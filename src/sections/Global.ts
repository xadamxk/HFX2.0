import { Section } from "../core/Section";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

class Global extends Section {
  constructor() {
    super(["/"], [], GlobeAltIcon);
    this.class = "Global";
    this.name = "Global";
  }
}

export default new Global();
