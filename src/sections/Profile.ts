import { Section } from "../core/Section";

class Profile extends Section {
  constructor() {
    super(["/member.php"], []);
    this.class = "Profile";
    this.name = "Profiles";
  }
}

export default new Profile();
