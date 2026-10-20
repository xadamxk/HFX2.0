import SmartQuote from "./SmartQuote";
import SelectorManager from "../../core/SelectorManager";

const settings = {
  quoteTextColor: "#000",
  quoteHeaderBackground: "#B1D8BF",
  quoteMentionColor: "#CD5C5C",
  quoteBackground: "#444444",
};

const HEADER_BACKGROUND = "rgb(177, 216, 191)";
const MENTION_BACKGROUND = "rgb(205, 92, 92)";
const QUOTE_BACKGROUND = "rgb(68, 68, 68)";

const welcome = (username: string) =>
  `<div class="welcome"><strong><a href="member.php?uid=1">${username}</a></strong></div>`;

const quote = (author: string) => `
  <blockquote class="mycode_quote">
    <cite><span> (01-01-2026, 12:00 PM)<span>Date</span></span>
      <span class="formatted_quote_username"><a><span class="group4">${author}</span></a></span> Wrote:
    </cite>
    Quoted text
  </blockquote>`;

const quotes = () =>
  Array.from(document.querySelectorAll("blockquote")) as HTMLElement[];

const cite = (blockquote: HTMLElement) =>
  blockquote.querySelector("cite") as HTMLElement;

describe("SmartQuote", () => {
  it("highlights quotes that mention the logged-in user", () => {
    document.body.innerHTML = welcome("Alice") + quote("Alice") + quote("Bob");

    SmartQuote.run(settings);

    const [mine, theirs] = quotes();
    expect(cite(mine).style.background).toBe(MENTION_BACKGROUND);
    expect(cite(theirs).style.background).toBe(HEADER_BACKGROUND);
    expect(cite(mine).className).toBe("without-after-element");
  });

  it("styles quotes without reporting a selector error when logged out", () => {
    document.body.innerHTML = quote("Alice") + quote("Bob");
    const errorsBefore = SelectorManager.getInstance().getErrors().length;

    expect(() => SmartQuote.run(settings)).not.toThrow();

    quotes().forEach((blockquote) => {
      expect(blockquote.style.backgroundColor).toBe(QUOTE_BACKGROUND);
      expect(cite(blockquote).style.background).toBe(HEADER_BACKGROUND);
    });
    expect(SelectorManager.getInstance().getErrors()).toHaveLength(errorsBefore);
  });

  it("does not mark every quote as a mention when the username is empty", () => {
    document.body.innerHTML = welcome("  ") + quote("Alice") + quote("Bob");

    SmartQuote.run(settings);

    quotes().forEach((blockquote) => {
      expect(cite(blockquote).style.background).toBe(HEADER_BACKGROUND);
    });
  });

  it("keeps styling later quotes after a quote without a cite or timestamp", () => {
    document.body.innerHTML =
      welcome("Alice") +
      `<blockquote>No header</blockquote>` +
      `<blockquote><cite>Header without a timestamp</cite>Text</blockquote>` +
      quote("Bob");

    expect(() => SmartQuote.run(settings)).not.toThrow();

    const [noCite, noSpan, last] = quotes();
    expect(noCite.style.backgroundColor).toBe(QUOTE_BACKGROUND);
    expect(cite(noSpan).style.background).toBe(HEADER_BACKGROUND);
    expect(cite(last).style.background).toBe(HEADER_BACKGROUND);
    expect(
      (cite(last).querySelector("span") as HTMLElement).style.color
    ).toBe("rgb(0, 0, 0)");
  });
});
