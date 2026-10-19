import { Section } from "../core/Section";

class ForumDisplay extends Section {
  constructor() {
    super(["/forumdisplay.php"], []);
    this.class = "ForumDisplay";
    this.name = "Forum Display";
  }
}

export default new ForumDisplay();
