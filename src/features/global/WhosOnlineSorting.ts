import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Feature } from "../../core/Feature";
import { appendChildren, el, ElChild } from "../../core/Dom";
import Global from "../../sections/Global";

enum STORAGE_KEYS {
  GROUP_MAP = "groupMap",
  NEXT_FETCH = "groupMapNextFetch",
}

// Refresh the group map daily so new groups don't stay "Unknown"
const GROUP_MAP_TTL = 24 * 60 * 60 * 1000;
// After a failed or empty fetch, wait before trying showgroups.php again
const FAILED_FETCH_RETRY_DELAY = 60 * 60 * 1000;

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
   * Use the stored group map while it's fresh, otherwise refetch it. Falls back to
   * the stored map if the refetch fails; null when there's no map at all.
   */
  private async resolveGroupMap(
    settings: any
  ): Promise<Record<string, string> | null> {
    const storedMap = settings[`storage_${STORAGE_KEYS.GROUP_MAP}`] as
      | Record<string, string>
      | undefined;
    const hasStoredMap = !!storedMap && Object.keys(storedMap).length > 0;
    const nextFetch =
      Number(settings[`storage_${STORAGE_KEYS.NEXT_FETCH}`]) || 0;

    // Not due yet: either the map is fresh, or a recent fetch failed and we're waiting to retry
    if (Date.now() < nextFetch) {
      this.logger.debug(
        hasStoredMap
          ? "Group map found, appending sorted members..."
          : "Group map fetch failed recently, skipping sort."
      );
      return hasStoredMap ? storedMap : null;
    }

    this.logger.debug("Group map missing or stale, fetching...");
    const fetchedMap = await this.fetchGroupMap();
    if (fetchedMap) {
      await this.saveStorageItem(STORAGE_KEYS.GROUP_MAP, fetchedMap);
      await this.saveStorageItem(
        STORAGE_KEYS.NEXT_FETCH,
        Date.now() + GROUP_MAP_TTL
      );
      return fetchedMap;
    }

    await this.saveStorageItem(
      STORAGE_KEYS.NEXT_FETCH,
      Date.now() + FAILED_FETCH_RETRY_DELAY
    );
    return hasStoredMap ? storedMap : null;
  }

  private async saveStorageItem(id: STORAGE_KEYS, value: unknown) {
    try {
      await this.settingsService.setStorageItem(this, id, value);
    } catch (error) {
      this.logger.debug(`Failed to save ${id}: ${error}`);
    }
  }

  /**
   * Fetch class -> group name pairs from showgroups.php.
   * Returns null on a network/HTTP error or when no groups were found (e.g. logged out).
   */
  private async fetchGroupMap(): Promise<Record<string, string> | null> {
    let html: string;
    try {
      const response = await fetch("https://hackforums.net/showgroups.php", {
        credentials: "include",
      });
      if (!response.ok) {
        this.logger.debug(`Group map fetch failed: HTTP ${response.status}`);
        return null;
      }
      html = await response.text();
    } catch (error) {
      this.logger.debug(`Group map fetch failed: ${error}`);
      return null;
    }

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

    return Object.keys(map).length > 0 ? map : null;
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
