import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import Global from "../../sections/Global";

enum STORAGE_KEYS {
  GROUP_MAP = "groupMap",
}

type GroupItem = { el: Element; hasStar: boolean };

const KNOWN_GROUPS = {
  group38: "Closed",
  group24: "Bots",
  group7: "Banned",
  group4: "Admins",
  "gradient-blue": "Staff", // likely to break
  group28: "Uber",
  group9: "Leet",
  group2: "Normal",
  group67: "Venders",
};

class WhosOnlineSorting extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Whos Online Sorting",
      enabled: true,
      description: "Sorts online member list by usergroup.",
      configurables: [
        new Checkbox({
          id: "labelByGroup",
          label: "Label by Group",
          description:
            "Groups online members by their usergroup and labels them with their group name.",
          default: true,
        }),
      ],
      storageItems: [
        {
          id: STORAGE_KEYS.GROUP_MAP,
          description: "",
          defaultValue: {},
        },
      ],
    });
  }

  async run(settings: any) {
    const boardStats = document.getElementById("boardstats_e");
    if (!boardStats) return;

    const labelByGroup: boolean = settings.labelByGroup;

    const targetCell = boardStats.querySelector(
      "td.trow1 > span.smalltext"
    ) as HTMLElement | null;
    if (!targetCell) return;

    const { groupOrder, membersByGroup, summaryHtml } =
      this.sortOnlineMembers(boardStats);
    if (groupOrder.length === 0) return;

    const sortedGroupOrder = this.sortGroupOrder(groupOrder);

    const groupMap = settings[`storage_${STORAGE_KEYS.GROUP_MAP}`] as Record<
      string,
      string
    >;

    if (!groupMap || Object.keys(groupMap).length === 0) {
      Logger.debug("No group map or unknown group found, fetching...");
      const newGroupMap = await this.fetchGroupMap();
      this.appendSortedMembers(
        sortedGroupOrder,
        membersByGroup,
        { ...newGroupMap, ...KNOWN_GROUPS },
        targetCell,
        labelByGroup,
        summaryHtml
      );
    } else {
      Logger.debug("Group map found, appending sorted members...");
      this.appendSortedMembers(
        sortedGroupOrder,
        membersByGroup,
        { ...groupMap, ...KNOWN_GROUPS },
        targetCell,
        labelByGroup,
        summaryHtml
      );
    }
  }

  private async fetchGroupMap(): Promise<Record<string, string>> {
    const response = await fetch("https://hackforums.net/showgroups.php", {
      credentials: "include",
    });
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const map: Record<string, string> = {};
    const containers = doc.querySelectorAll(".groupName");
    containers.forEach((container) => {
      const span = container.querySelector(
        "span > strong > span"
      ) as HTMLElement | null;
      if (!span) return;
      const className = span.className?.trim();
      const groupName = span.textContent?.trim();
      if (!className || !groupName) return;
      map[className] = groupName;
    });

    try {
      await this.settingsService.setStorageItem(
        this,
        STORAGE_KEYS.GROUP_MAP,
        map
      );
    } catch {}

    return map;
  }

  private sortOnlineMembers(boardStats: HTMLElement): {
    groupOrder: string[];
    membersByGroup: Record<string, GroupItem[]>;
    summaryHtml: string;
  } {
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

    // Capture the summary (everything before the first <br>)
    let summaryHtml = "";
    for (let k = 0; k < brIndex; k++) {
      const node = allChildNodes[k];
      if (node.nodeType === Node.TEXT_NODE) {
        summaryHtml += node.textContent || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        summaryHtml += (node as HTMLElement).outerHTML;
      }
    }

    // Build grouped items while preserving star markers following a name

    const groupOrder: string[] = [];
    const membersByGroup: Record<string, GroupItem[]> = {};

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
          const key = (() => {
            if (el.tagName === "A") {
              const childSpan = el.querySelector("span") as HTMLElement | null;
              return (childSpan && childSpan.className) || "no-class";
            }
            return (el as HTMLElement).className || "no-class";
          })();

          if (!membersByGroup[key]) {
            membersByGroup[key] = [];
            groupOrder.push(key);
          }
          membersByGroup[key].push({ el, hasStar });

          i = j;
          continue;
        }
      }
      i++;
    }

    // If nothing to group, exit
    if (groupOrder.length === 0) return;

    // Remove everything after <br>
    while (br.nextSibling) {
      targetCell.removeChild(br.nextSibling);
    }

    return { groupOrder, membersByGroup, summaryHtml };
  }

  private sortGroupOrder(groupOrder: string[]): string[] {
    const originalOrder = groupOrder.slice();

    // High-priority groups first (in this exact order)
    const topOrder = [
      "group4", // Admins
      "gradient-blue", // Staff
      "group67", // Venders
      "group28", // Uber
      "group9", // Leet
    ];

    // Lowest-priority groups last (in this exact order)
    const bottomOrder = [
      "group2", // Normal
      "group7", // Banned
      "group38", // Closed
      "group24", // Bots
    ];

    const topPriority: Record<string, number> = {};
    topOrder.forEach((key, index) => (topPriority[key] = index));

    const bottomPriority: Record<string, number> = {};
    bottomOrder.forEach((key, index) => (bottomPriority[key] = index));

    const BASE_UNKNOWN = 1000; // After top groups, before bottom groups
    const BASE_BOTTOM = 100000; // Ensure bottom groups are always last

    const getRank = (key: string): number => {
      if (topPriority[key] !== undefined) return topPriority[key];
      if (bottomPriority[key] !== undefined)
        return BASE_BOTTOM + bottomPriority[key];
      const originalIndex = originalOrder.indexOf(key);
      return BASE_UNKNOWN + (originalIndex === -1 ? 0 : originalIndex);
    };

    return groupOrder.sort((a, b) => {
      const rankA = getRank(a);
      const rankB = getRank(b);
      if (rankA !== rankB) return rankA - rankB;
      // Stable fallback: preserve original relative order for equal ranks
      return originalOrder.indexOf(a) - originalOrder.indexOf(b);
    });
  }

  private appendSortedMembers(
    groupOrder: string[],
    membersByGroup: Record<string, GroupItem[]>,
    groupMap: Record<string, string>,
    targetCell: HTMLElement,
    labelByGroup: boolean,
    summaryHtml: string
  ) {
    if (labelByGroup) {
      let html = "";
      groupOrder.forEach((key, groupIndex) => {
        const groupName = groupMap[key] || "Unknown";
        html += `<div class='whosonline-sorting-group'><span style='color:#fff;font-weight:bold;'>${groupName}</span> (${membersByGroup[key].length}): `;
        membersByGroup[key].forEach((item, memberIndex) => {
          html += (item.el as HTMLElement).outerHTML;
          html += item.hasStar ? "*" : "";
          if (memberIndex !== membersByGroup[key].length - 1) {
            html += ", ";
          }
        });
        html += "</div>";
        if (groupIndex !== groupOrder.length - 1) {
          html += "<br>";
        }
      });
      targetCell.innerHTML = `${summaryHtml}<br>${html}`;
    } else {
      // Build sorted HTML and replace entire contents of span.smalltext
      const items: GroupItem[] = [];
      for (const key of groupOrder) {
        for (const item of membersByGroup[key]) items.push(item);
      }
      const htmlParts = items.map((item) => {
        const html = (item.el as HTMLElement).outerHTML;
        return item.hasStar ? `${html}*` : html;
      });
      targetCell.innerHTML = `${summaryHtml}<br>${htmlParts.join(", ")}`;
    }
  }
}

export default new WhosOnlineSorting();
