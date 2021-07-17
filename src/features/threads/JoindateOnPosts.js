const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class JoindateOnPosts extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Joindate On Posts",
      default: true,
      description: "Adds joindate to postbit stats."
    });
  }

  run() {
    // Loop posts
    $(".post").each(function() {
      // Get joindate from avatar tooltip
      const joinDateData = $(this).find(".author_avatar > a").attr("data-tooltip");
      const joinDate = joinDateData ? joinDateData.replace("Joined ", "") : "N/A";
      // Append to postbit stats
      $(this).find(".author_wrapper").append($("<div>").addClass("author_row")
        .append($("<div>").addClass("author_label").text("Join Date:"))
        .append($("<div>").addClass("author_value").text(joinDate)));
    });
  }
};

module.exports = new JoindateOnPosts();
