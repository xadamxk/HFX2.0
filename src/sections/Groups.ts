import { Section } from "../core/Section";

class Groups extends Section {
  constructor() {
    super(["/showgroups.php"], []);
    this.class = "Groups";
    this.name = "Groups";
  }
}

export default new Groups();
