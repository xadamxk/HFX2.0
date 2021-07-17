const Feature = require("../../core/Feature");
const Game = require("../../sections/Game");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Stepper = require("../../configurables/Stepper");
const Checkbox = require("../../configurables/Checkbox");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");

const slotsSection = new Section("/slots.php");

class AutoSlots extends Feature {
  constructor() {
    super({
      section: Game,
      name: "Auto Slots",
      default: true,
      description: "Play slots automatically based on settings.",
      configurables: new ConfigurableArray(
        new Stepper({ id: "ASGamesPerSession", label: "Games Per Session", step: 1, default: 20 }),
        new Checkbox({ id: "ASConfirmRounds", label: "Manual Confirmation between Round", default: false })
      ),
      additionalSections: new SectionArray(slotsSection)
    });
    this.slotsConfig = {
      "numIconsPerReel": 6, // Number of icons per reel
      "stripHeight": 720, // Height of reel image in pixels
      "alignmentOffset": 86, // Offset for reel to match container
      "positioningTime": 0, // reel animation default: 200
      "bounceHeight": 0, // reel animation default: 200
      "bounceTime": 0 // reel animation default: 1000
    };
  }

  run() {
    const currentPageUrl = location.href;
    // Don't do anything if not slots
    if (currentPageUrl.includes("/slots.php")) {
      //
    }
  }
};

module.exports = new AutoSlots();
