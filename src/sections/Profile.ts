import { Section } from "../core/Section";

class Profile extends Section {
  constructor() {
    // Other member.php actions (login, register, ...) share the path
    super(["/member.php?action=profile"], []);
    this.class = "Profile";
    this.name = "Profiles";
  }
}

export default new Profile();
