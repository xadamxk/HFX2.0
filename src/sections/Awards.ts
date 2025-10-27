import { TrophyIcon } from "@heroicons/react/24/outline";
import { Section } from "../core/Section";

class Awards extends Section {
  constructor() {
    super(["/myawards.php"], [], TrophyIcon);
    this.class = "Awards";
    this.name = "Awards";
  }
}

export default new Awards();
