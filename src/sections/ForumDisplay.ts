import { Section } from "../core/Section";

class ForumDisplay extends Section {
  constructor() {
    super(["/forumdisplay.php"], [""]);
  }
};

export default new ForumDisplay();

