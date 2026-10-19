import { Section } from "../core/Section";

class Threads extends Section {
  constructor() {
    super(["/showthread.php"], []);
    this.class = "Threads";
    this.name = "Threads";
  }
}

export default new Threads();
