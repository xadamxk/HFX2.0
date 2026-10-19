import { Section } from "../core/Section";

class Global extends Section {
  constructor() {
    super(["/"], []);
    this.class = "Global";
    this.name = "Global";
  }
}

export default new Global();
