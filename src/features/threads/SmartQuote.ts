import { ColorPicker } from "../../configuration/configurables/ColorPicker";
import { Feature } from "../../core/Feature";
import { Util } from "../../core/Util";
import Threads from "../../sections/Threads";

class SmartQuote extends Feature {
  constructor() {
    super({
      section: Threads,
      name: "Smart Quote",
      enabled: false,
      description: "Customize quote styles.",
      configurables: [
        new ColorPicker({
          id: "quoteHeaderColor",
          label: "Quote Header Text Color",
          description: "The color of the quote header text.",
          default: "#000",
        }),
        new ColorPicker({
          id: "quoteHeaderBackground",
          label: "Quote Header Background Color",
          description: "The color of the quote header background.",
          default: "#B1D8BF",
        }),
        new ColorPicker({
          id: "quoteMentionColor",
          label: "Quote Header MentionBackground Color",
          description:
            "The color of quote header background when you are mentioned in the quote.",
          default: "#CD5C5C",
        }),
        new ColorPicker({
          id: "quoteBackground",
          label: "Quote Background Color",
          description: "The color of the quote background.",
          default: "#ADB1A1",
        }),
      ],
    });
  }

  run(settings: any) {
    const currentUserName = this.querySelector(
      ".welcome > strong > a"
    ).textContent;

    // Remove the ::after element (underline) from the cite element
    Util.addCssToPage(`
      .without-after-element:after {
      content: none !important;
      display: none !important;
      }`);

    const quoteHeaderColor = settings.quoteHeaderColor;
    const quoteHeaderBackground = settings.quoteHeaderBackground;
    const quoteMentionColor = settings.quoteMentionColor;
    const quoteBackground = settings.quoteBackground;

    document.querySelectorAll("blockquote").forEach((blockquote) => {
      // blockquote
      blockquote.style.borderRadius = "5px";
      blockquote.style.border = "1px solid black";
      blockquote.style.padding = "2px 6px";
      blockquote.style.marginTop = "10px";
      blockquote.style.backgroundColor = quoteBackground;
      blockquote.style.color = quoteHeaderColor;

      const citeElement = blockquote.querySelector("cite");

      const isMentioned = citeElement?.textContent?.includes(currentUserName);
      if (isMentioned) {
        citeElement.style.background = quoteMentionColor;
      } else {
        citeElement.style.background = quoteHeaderBackground;
      }

      citeElement.style.borderRadius = "5px";
      citeElement.style.border = "1px solid black";
      citeElement.style.color = quoteHeaderColor;
      citeElement.style.fontWeight = "bold";
      // Remove the ::after element (underline)
      citeElement.className = "without-after-element";

      // Color the quote header timestamp color
      const quoteHeaderTimestamp = citeElement.querySelector("span");
      quoteHeaderTimestamp.style.color = quoteHeaderColor;

      const quoteHeaderTimestampText =
        quoteHeaderTimestamp.querySelector("span");
      if (quoteHeaderTimestampText) {
        quoteHeaderTimestampText.style.color = quoteHeaderColor;
      }
    });
  }
}

export default new SmartQuote();
