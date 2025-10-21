import { Section } from "../core/Section";
import { DocumentIcon } from "@heroicons/react/24/outline";

class Threads extends Section {
  constructor() {
    super(["/showthread.php"], [], DocumentIcon);
    this.class = "Threads";
    this.name = "Threads";
  }
}

export default new Threads();
