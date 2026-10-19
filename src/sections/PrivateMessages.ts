import { Section } from "../core/Section";

class PrivateMessages extends Section {
  constructor() {
    super(["/private.php"], []);
    this.class = "PrivateMessages";
    this.name = "Private Messages";
  }
}

export default new PrivateMessages();
