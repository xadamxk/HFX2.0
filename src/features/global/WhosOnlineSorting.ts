import { Feature } from "../../core/Feature";
import Global from "../../sections/Global";

class WhosOnlineSorting extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Whos Online Sorting",
      enabled: true,
      description: "Sorts online member list by usergroup.",
    });
  }

  run() {
    const boardStats = document.getElementById("boardstats_e");
    if (!boardStats) return;

    const rows = boardStats.querySelectorAll("tr");
    if (!rows || rows.length < 2) return;

    const targetCell = rows[1].querySelector("td.trow1 > span.smalltext");
    if (!targetCell) return;

    const br = targetCell.querySelector("br");
    if (!br) return;

    // Collect nodes after the first <br>
    const allChildNodes = Array.from(targetCell.childNodes);
    const brIndex = allChildNodes.indexOf(br);
    if (brIndex === -1) return;

    // Build grouped items while preserving star markers following a name
    type GroupItem = { el: Element; hasStar: boolean };
    const groupOrder: string[] = [];
    const groups: Record<string, GroupItem[]> = {};

    let i = brIndex + 1;
    while (i < allChildNodes.length) {
      const node = allChildNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.tagName === "SPAN" || el.tagName === "A") {
          // Capture trailing text nodes (stars/commas/spaces) up to the next element
          let j = i + 1;
          let trailingText = "";
          while (
            j < allChildNodes.length &&
            allChildNodes[j].nodeType === Node.TEXT_NODE
          ) {
            trailingText += allChildNodes[j].textContent || "";
            j++;
          }

          const hasStar = trailingText.includes("*");
          const key =
            el.tagName === "A"
              ? "links"
              : (el as HTMLElement).className || "no-class";

          if (!groups[key]) {
            groups[key] = [];
            groupOrder.push(key);
          }
          groups[key].push({ el, hasStar });

          i = j;
          continue;
        }
      }
      i++;
    }

    console.log("groups");
    console.log(groups);

    console.log("group order");
    console.log(groupOrder);

    // If nothing to group, exit
    if (groupOrder.length === 0) return;

    // Remove everything after <br>
    while (br.nextSibling) {
      targetCell.removeChild(br.nextSibling);
    }

    // Build sorted HTML and replace entire contents of span.smalltext
    const items: GroupItem[] = [];
    for (const key of groupOrder) {
      for (const item of groups[key]) items.push(item);
    }
    const htmlParts = items.map((item) => {
      const html = (item.el as HTMLElement).outerHTML;
      return item.hasStar ? `${html}*` : html;
    });
    targetCell.innerHTML = htmlParts.join(", ");
  }
}

export default new WhosOnlineSorting();
