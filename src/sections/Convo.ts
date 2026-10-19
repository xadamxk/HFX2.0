import { Section } from "../core/Section";

class Convo extends Section {
  constructor() {
    super(["/convo.php"], []);
    this.class = "Convo";
    this.name = "Convo";
  }
}

export default new Convo();
