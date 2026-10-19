import { Section } from "../core/Section";

class Popularity extends Section {
  constructor() {
    super(["/reputation.php"], []);
    this.class = "Popularity";
    this.name = "Popularity";
  }
}

export default new Popularity();
