const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");

class ConvoUserMention extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Convo User Mention",
      default: true,
      description: "Allows you to search and tag users in groups."
    });
  }

  run() {
    // https://yaireo.github.io/tagify/
    var whitelist1 = [
      { value: 100, text: "kenny", title: "Kenny McCormick" },
      { value: 200, text: "cartman", title: "Eric Cartman" },
      { value: 300, text: "kyle", title: "Kyle Broflovski" },
      { value: 400, text: "token", title: "Token Black" },
      { value: 500, text: "jimmy", title: "Jimmy Valmer" },
      { value: 600, text: "butters", title: "Butters Stotch" },
      { value: 700, text: "stan", title: "Stan Marsh" },
      { value: 800, text: "randy", title: "Randy Marsh" },
      { value: 900, text: "Mr. Garrison", title: "POTUS" },
      { value: 1000, text: "Mr. Mackey", title: "M'Kay" }
    ];
    // Second whitelist, which is shown only when starting to type "#".
    // Thiw whitelist is the most simple one possible.
    var whitelist2 = ["Homer simpson", "Marge simpson", "Bart", "Lisa", "Maggie", "Mr. Burns", "Ned", "Milhouse", "Moe"];

    //
    var input = document.querySelector("[id=comment]");
    // init Tagify script on the above inputs
    var tagify = new Tagify(input, {
      //  mixTagsInterpolator: ["{{", "}}"],
      mode: "mix", // <--  Enable mixed-content
      pattern: /@|#/, // <--  Text starting with @ or # (if single, String can be used here)
      tagTextProp: "text", // <-- the default property (from whitelist item) for the text to be rendered in a tag element.
      // Array for initial interpolation, which allows only these tags to be used
      whitelist: whitelist1.concat(whitelist2).map(function(item) { return typeof item === "string" ? {value: item} : item; }),

      dropdown: {
        enabled: 1,
        position: "text", // <-- render the suggestions list next to the typed text ("caret")
        mapValueTo: "text", // <-- similar to above "tagTextProp" setting, but for the dropdown items
        highlightFirst: true // automatically highlights first sugegstion item in the dropdown
      },
      callbacks: {
        add: console.log, // callback when adding a tag
        remove: console.log // callback when removing a tag
      }
    });
    // A good place to pull server suggestion list accoring to the prefix/value
    tagify.on("input", function(e) {
      var prefix = e.detail.prefix;
      console.log(e.detail);

      // first, clean the whitlist array, because the below code, while not, might be async,
      // therefore it should be up to you to decide WHEN to render the suggestions dropdown
      // tagify.settings.whitelist.length = 0;

      if (prefix) {
        if (prefix === "@") { tagify.settings.whitelist = whitelist1; }

        if (prefix === "#") { tagify.settings.whitelist = whitelist2; }

        if (e.detail.value.length > 1) { tagify.dropdown.show.call(tagify, e.detail.value); }
      }

      console.log(tagify.value);
      console.log("mix-mode \"input\" event value: ", e.detail);
    });

    tagify.on("add", function(e) {
      console.log(e);
    });
  }
};

module.exports = new ConvoUserMention();
