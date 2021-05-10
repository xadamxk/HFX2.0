const Feature = require("../../core/Feature");
const Threads = require("../../sections/Threads");

class GivePopularityPostbitButton extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Give Popularity Button",
      default: true,
      description: "Adds a button to quickly rate a user next to the popularity number.",
      author: {
        name: "James",
        profile: "https://hackforums.net/member.php?action=profile&uid=2774521"
      }
    });
  }

  run() {
    document.querySelectorAll("div.post_wrapper a[href*='reputation.php?uid=']").forEach((postbit) => {
      let rate = document.createElement("a");

      rate.href = `javascript:MyBB.reputation(${postbit.getAttribute("href").split("=")[1]})`;
      rate.textContent = "+";
      rate.id = "HFXGivePopularityButton";
      rate.onclick = "";
      rate.style.color = "#4CAF50";
      rate.innerHTML = "<i class=\"fa fa-plus-circle\" style=\"color: #4CAF50;\" aria-hidden=\"true\"></i>";

      postbit.parentElement.prepend(rate);
    });
  }
}

module.exports = new GivePopularityPostbitButton();
