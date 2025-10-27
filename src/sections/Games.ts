import { PuzzlePieceIcon } from "@heroicons/react/24/outline";
import { Section } from "../core/Section";

class Games extends Section {
  constructor() {
    super(["/gamecp.php"], [], PuzzlePieceIcon);
    this.class = "Games";
    this.name = "Games";
  }
}

export default new Games();
