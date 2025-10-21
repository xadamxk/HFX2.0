import { Section } from "../core/Section";

class PrivateMessages extends Section {
  constructor() {
    super(["/private.php"], [""]);
  }
};

export default new PrivateMessages();

