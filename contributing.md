# Getting Started (Development)

Contribution steps coming soon

# Features, Modules, and More
## Adding Features
- Create feature using template: ```yarn template```
- Choose a template type: ```Feature```
- Provide feature meta data:
  - Name: The name of the feature (label in settings)
  - Section: The section this feature will be grouped into and run on
  - Description: Additional feature information found in settings
  - Default Settings: Enabled by default (yes,no)
- Code your feature in the run function: ```src/features/{section}/{your_feature_name}.js```
- Test by side loading HFX and load a page that matches the feature's section path

## Adding Sections
- Create section using template: ```yarn template```
- Choose a template type: ```Section```
- Provide section meta data:
  - Name: The name of the section (referenced by features)
  - Paths: An array of URL paths that features of this section will trigger on (ex. /index.php, /game.php)
  - Element Selectors: An arary of element selectors that features of this section will trigger on (ex. #home-page)
- Add a new feature (above) and select the newly created section

## Feature Configuration & Customization
Some features need more options beyond the default enabled/disabled and that is possible using configurables in the feature's constructor. The snippet below adds each of the available configurables: checkbox, textbox, and color. Each configurable requires a unique id, a label for settings, and a default value appropriate to the configurable type.

```typescript

import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Dropdown } from "../../configuration/configurables/Dropdown";
import Global from "../../sections/Global";

// These keys represent the "id" values of a feature's configurables
interface TestSettings {
  enabled: boolean;
  showNotifications: boolean;
  theme: string;
}

enum STORAGE_KEYS = {
  TEST = "test",
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
      storageItems: [
        {
          id: STORAGE_KEYS.TEST,
          description: "Test storage item",
          defaultValue: "test-value",
        },
      ],
    });
  }

  run(settings: TestSettings) {
    // this.querySelector("#test", document); // will throw and log an error for not finding the element
    Logger.debug("Test ran successfully with settings: ", settings);
    Logger.debug("Pull storage item values: ", settings[`storage_${STORAGE_KEYS.TEST}`]);
  }
}
export default new Test();
```