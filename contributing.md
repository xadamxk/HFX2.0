# Getting Started (Development)

Contribution steps coming soon

# Features, Modules, and More
## Adding Features
- Create feature using template: ```yarn template```
- Choose a template type: ```Feature```
- Provide feature meta data:
  - Name: The name of the feature (label in settings)
  - Section: The section this feature will be grouped into
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
- Add a new feature (above) and select the newly created section

## Feature Configuration & Customization
Some features need more options beyond the default enabled/disabled and that is possible using configurables in the feature's constructor. The snippet below adds each of the available configurables: checkbox, textbox, and color. Each configurable requires a unique id, a label for settings, and a default value appropriate to the configurable type.

Examples coming soon