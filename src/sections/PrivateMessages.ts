import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Section } from "../core/Section";

class PrivateMessages extends Section {
  constructor() {
    super(["/private.php"], [], EnvelopeIcon);
    this.class = "PrivateMessages";
    this.name = "Private Messages";
  }
}

export default new PrivateMessages();
