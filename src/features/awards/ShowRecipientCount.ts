import { Feature } from "../../core/Feature";
import Awards from "../../sections/Awards";

class ShowRecipientCount extends Feature {
  constructor() {
    super({
      section: Awards,
      name: "Show Recipient Count",
      enabled: true,
      description: "Shows number of recipients on each award page.",
    });
  }

  run() {
    const isIndividualAward = window.location.href.includes(
      "myawards.php?awid="
    )
      ? "recipients"
      : "awards";
    const count = this.querySelectorAll(".award_sprite", document, true).length;

    this.querySelectorAll("strong", document, true).forEach((strong) => {
      if (strong.textContent.includes("My Awards")) {
        const span = document.createElement("span");
        span.className = "float_right";
        span.textContent = `${count} ${isIndividualAward}`;
        strong.insertAdjacentElement("afterend", span);
      }
    });
  }
}

export default new ShowRecipientCount();
