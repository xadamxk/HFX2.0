import { Section } from "../core/Section";

class Games extends Section {
  constructor() {
    super(["/gamecp.php"], []);
    this.class = "Games";
    this.name = "Games";
  }
}

export default new Games();
