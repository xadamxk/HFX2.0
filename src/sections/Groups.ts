import { UserGroupIcon } from "@heroicons/react/24/outline";
import { Section } from "../core/Section";

class Groups extends Section {
  constructor() {
    super(["/showgroups.php"], [], UserGroupIcon);
    this.class = "Groups";
    this.name = "Groups";
  }
}

export default new Groups();
