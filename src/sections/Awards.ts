import { Section } from "../core/Section";

class Awards extends Section {
  constructor() {
    super(["/myawards.php"], []);
    this.class = "Awards";
    this.name = "Awards";
  }
}

export default new Awards();
