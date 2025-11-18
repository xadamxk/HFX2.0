import { HandThumbUpIcon } from "@heroicons/react/24/outline";
import { Section } from "../core/Section";

class Popularity extends Section {
  constructor() {
    super(["/reputation.php"], [], HandThumbUpIcon);
    this.class = "Popularity";
    this.name = "Popularity";
  }
}

export default new Popularity();
