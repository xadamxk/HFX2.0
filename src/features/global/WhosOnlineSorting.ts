import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Feature } from "../../core/Feature";
import { appendChildren, el, ElChild } from "../../core/Dom";
import { resolveGroupMap } from "../../core/GroupMap";
import Global from "../../sections/Global";

// Chat Bubbles reads the same group map cache
export enum STORAGE_KEYS {
  GROUP_MAP = "groupMap",
  NEXT_FETCH = "groupMapNextFetch",
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
      id: "WhosOnlineSorting",
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
        {
          id: STORAGE_KEYS.NEXT_FETCH,
          description: "",
          defaultValue: 0,
        },
      ],
    });
  }

  async run(settings: any) {
    // Who's Online only exists on the index, but this feature runs everywhere
    const boardStats = this.querySelector<HTMLElement>(
      "#boardstats_e",
      document,
      true
    );
    if (!boardStats) return;

    const labelByGroup: boolean = settings.labelByGroup;

    const targetCell = this.querySelector<HTMLElement>(
      "td.trow1 > span.smalltext",
      boardStats
    );
    if (!targetCell) return;

    const members = this.collectOnlineMembers(targetCell);
    if (!members) return;
    const { groupOrder, membersByGroup, summaryNodes } = members;

    // Resolve the group map before touching the DOM, so a failed fetch leaves HF's list as-is
    const groupMap = await this.resolveGroupMap(settings);
    if (!groupMap) return;

    this.appendSortedMembers(
      this.sortGroupOrder(groupOrder),
      membersByGroup,
      { ...groupMap, ...KNOWN_GROUPS },
      targetCell,
      labelByGroup,
      summaryNodes
    );
  }

  /**
   * The shared group map (see core/GroupMap), cached in this feature's storage
   * items. Chat Bubbles reads and refreshes the same cache.
   */
  private async resolveGroupMap(
    settings: any
  ): Promise<Record<string, string> | null> {
    return resolveGroupMap({
      stored: settings[`storage_${STORAGE_KEYS.GROUP_MAP}`],
      nextFetch: Number(settings[`storage_${STORAGE_KEYS.NEXT_FETCH}`]) || 0,
      save: async (map, nextFetch) => {
        if (map) await this.saveStorageItem(STORAGE_KEYS.GROUP_MAP, map);
        await this.saveStorageItem(STORAGE_KEYS.NEXT_FETCH, nextFetch);
      },
    });
  }

  private async saveStorageItem(id: STORAGE_KEYS, value: unknown) {
    try {
      await this.settingsService.setStorageItem(this, id, value);
    } catch (error) {
      this.logger.debug(`Failed to save ${id}: ${error}`);
    }
  }

  /**
   * Group the online members in the cell by usergroup. Read-only: the DOM is only
   * changed later by appendSortedMembers. Returns null when there's nothing to sort.
   */
  private collectOnlineMembers(targetCell: HTMLElement): {
    groupOrder: string[];
    membersByGroup: Record<string, GroupItem[]>;
    summaryNodes: Node[];
  } | null {
    // No member list after the summary (e.g. nobody online)
    const br = this.querySelector("br", targetCell, true);
    if (!br) return null;

    // Collect nodes after the first <br>
    const allChildNodes = Array.from(targetCell.childNodes);
    const brIndex = allChildNodes.indexOf(br);
    if (brIndex === -1) return null;

    // Capture the summary (everything before the first <br>)
    const summaryNodes = allChildNodes
      .slice(0, brIndex)
      .filter(
        (node) =>
          node.nodeType === Node.TEXT_NODE ||
          node.nodeType === Node.ELEMENT_NODE
      );

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
    if (groupOrder.length === 0) return null;

    return { groupOrder, membersByGroup, summaryNodes };
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
    summaryNodes: Node[]
  ) {
    // Member elements are moved (not re-serialized) so HF's markup is never re-parsed
    const memberList = (items: GroupItem[]) => {
      const nodes: ElChild[] = [];
      items.forEach((item, index) => {
        if (index > 0) nodes.push(", ");
        nodes.push(item.el, item.hasStar && "*");
      });
      return nodes;
    };

    const content: ElChild[] = [];
    if (labelByGroup) {
      groupOrder.forEach((key, groupIndex) => {
        const groupName = groupMap[key] || "Unknown";
        if (groupIndex > 0) content.push(el("br"));
        content.push(
          el("div", { class: "whosonline-sorting-group" }, [
            el("span", { style: "color:#fff;font-weight:bold;" }, groupName),
            ` (${membersByGroup[key].length}): `,
            ...memberList(membersByGroup[key]),
          ])
        );
      });
    } else {
      // Flatten sorted members into a single comma-separated list
      const items: GroupItem[] = [];
      for (const key of groupOrder) {
        for (const item of membersByGroup[key]) items.push(item);
      }
      content.push(...memberList(items));
    }

    // Replace entire contents of span.smalltext
    targetCell.replaceChildren(...summaryNodes);
    appendChildren(targetCell, [el("br"), ...content]);
  }
}

export default new WhosOnlineSorting();
