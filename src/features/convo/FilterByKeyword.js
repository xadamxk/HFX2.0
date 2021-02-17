const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");

class FilterByKeyword extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Filter By Keyword",
      default: true,
      description: "Automatically hide messages containing keywords (ie 'ebook,tiktok,anime')."
    });
  }

  run() {
  }
};

module.exports = new FilterByKeyword();
