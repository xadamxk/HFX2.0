import { Section } from "../core/Section";
import { QueueListIcon } from "@heroicons/react/24/outline";

class ForumDisplay extends Section {
  constructor() {
    super(["/forumdisplay.php"], [], QueueListIcon);
    this.class = "ForumDisplay";
    this.name = "Forum Display";
  }
}

export default new ForumDisplay();
