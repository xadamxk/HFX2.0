import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Section } from "../core/Section";

class Convo extends Section {
  constructor() {
    super(["/convo.php"], [], ChatBubbleLeftRightIcon);
    this.class = "Convo";
    this.name = "Convo";
  }
}

export default new Convo();
