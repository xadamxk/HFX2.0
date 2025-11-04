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
          id: "quoteTextColor",
          label: "Quote Text Color",
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
          label: "Quote Header Mention Background Color",
          description:
            "The color of quote header background when you are mentioned in the quote.",
          default: "#CD5C5C",
        }),
        new ColorPicker({
          id: "quoteBackground",
          label: "Quote Background Color",
          description: "The color of the quote background.",
          default: "#444444",
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

    const quoteTextColor = settings.quoteTextColor;
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
      // blockquote.style.color = quoteTextColor;

      const citeElement = blockquote.querySelector(
        "cite"
      ) as HTMLElement | null;

      // Remove classes from quoted username spans and apply bold/white styling
      const quoteUsername = citeElement?.querySelector(
        ".formatted_quote_username > a > span"
      ) as HTMLElement | null;
      if (quoteUsername) {
        quoteUsername.removeAttribute("class");
        quoteUsername.style.fontWeight = "bold";
        quoteUsername.style.color = quoteTextColor;
      }

      // Remove the literal "Wrote:" text from the cite
      // if (citeElement) {
      //   Array.from(citeElement.childNodes).forEach((node) => {
      //     if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      //       node.textContent = node.textContent.replace(/\s*Wrote:\s*/i, " ");
      //     }
      //   });
      // }

      const isMentioned = citeElement?.textContent?.includes(currentUserName);
      if (isMentioned) {
        citeElement.style.background = quoteMentionColor;
      } else {
        citeElement.style.background = quoteHeaderBackground;
      }

      citeElement.style.borderRadius = "5px";
      citeElement.style.border = "1px solid black";
      citeElement.style.color = quoteTextColor;
      citeElement.style.fontWeight = "bold";
      // Remove the ::after element (underline)
      citeElement.className = "without-after-element";

      // Color the quote header timestamp color
      const quoteHeaderTimestamp = citeElement.querySelector("span");
      quoteHeaderTimestamp.style.color = quoteTextColor;

      const quoteHeaderTimestampText =
        quoteHeaderTimestamp.querySelector("span");
      if (quoteHeaderTimestampText) {
        quoteHeaderTimestampText.style.color = quoteTextColor;
      }
    });
  }
}

export default new SmartQuote();
