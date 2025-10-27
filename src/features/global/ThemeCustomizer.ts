import { Feature } from "../../core/Feature";
import Global from "../../sections/Global";

class ThemeCustomizer extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Theme Customizer",
      enabled: true,
      description:
        "Allows theme customization to the background, logo, accent color, and other elements.",
    });
  }

  run() {
    // TODO: Figure out if we want to port old themes or just allow customization to modern theme
  }
}

export default new ThemeCustomizer();
