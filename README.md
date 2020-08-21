# HFX2.0
> Enhance your HackForums experience - rewritten from the ground up with the community in mind

## Getting Started (Development)
- Install Node.js >=v11.0
- Install Yarn >=v1.13.0
- Clone this project and navigate to the project directory
- Install dependencies: ```yarn```
- Build the project: ```gulp build```
- Copy library assets: ```gulp libs```
- Watch code for changes: ```gulp watch```

### Development Tools & Features


-----
## Adding modules using Mustache
### Adding Features
- Create feature using template: ```yarn template```
- Choose a template type: ```Feature```
- Provide feature meta data:
  - Name: The name of the feature (label in settings)
  - Section: The section this feature will be grouped into
  - Description: Additional feature information found in settings
  - Default Settings: Enabled by default (yes,no)
- Code your feature in the run function: ```src/features/{section}/{your_feature_name}.js```
- Test by side loading HFX and load a page that matches the feature's section path

### Adding Sections
- Create section using template: ```yarn template```
- Choose a template type: ```Section```
- Provide section meta data:
  - Name: The name of the section (referenced by features)
  - Paths: An array of URL paths that features of this section will trigger on (ex. /index.php, /game.php)
- Add a new feature (above) and select the newly created section