import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Dropdown } from "../../configuration/configurables/Dropdown";
import Global from "../../sections/Global";

interface TestSettings {
  enabled: boolean;
  showNotifications: boolean;
  theme: string;
}

class Test extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Test Feature",
      description:
        "A test feature to demonstrate the popup interface with configurables",
      enabled: false,
      experimental: true,
      configurables: [
        new Checkbox({
          id: "showNotifications",
          label: "Show Notifications",
          description: "Display notifications when this feature is active",
          default: true,
        }),
        new Dropdown({
          id: "theme",
          label: "Theme",
          description: "Choose the visual theme for this feature",
          default: "light",
          options: [
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "Auto", value: "auto" },
          ],
        }),
      ],
    });
  }

  run(settings: TestSettings) {
    // this.querySelector("#test", document); // will throw an error
    Logger.debug("Test ran successfully with settings:", settings);
  }
}
export default new Test();
