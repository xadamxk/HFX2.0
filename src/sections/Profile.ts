import { UserIcon } from "@heroicons/react/24/outline";
import { Section } from "../core/Section";

class Profile extends Section {
  constructor() {
    super(["/member.php"], [], UserIcon);
    this.class = "Profile";
    this.name = "Profile";
  }
}

export default new Profile();
