import { Feature } from "../../core/Feature";
import {
  fetchSharedDocument,
  getOrFetch,
  SHOWGROUPS_URL,
} from "../../core/Remote";
import { Section } from "../../core/Section";
import { SectionArray } from "../../core/SectionArray";
import { Util } from "../../core/Util";
import Groups from "../../sections/Groups";

enum GroupManagementStorageKeys {
  MANAGED_GROUPS = "managedGroups",
}

interface ManagedGroup {
  groupId: number;
  groupName: string;
}

/** How older versions cached the managed groups. */
interface LegacyManagedGroupsCache {
  groups: ManagedGroup[];
  lastFetchTime: number;
}

class GroupManagement extends Feature {
  fetchDelay = 24 * 60 * 60 * 1000; // 24 hours
  constructor() {
    super({
      id: "GroupManagement",
      section: Groups,
      name: "Group Management",
      enabled: false,
      description:
        "GROUP LEADERS ONLY: Easily add, remove, and blacklist group members directly from their profile.",
      additionalSections: new SectionArray(new Section(["/member.php"], [])), // Profiles
      storageItems: [
        {
          id: GroupManagementStorageKeys.MANAGED_GROUPS,
          description: "Map of groups that the user is a leader of.",
          // { value: ManagedGroup[], fetchedAt } once fetched (see getOrFetch)
          defaultValue: null,
        },
      ],
    });
  }

  async run(settings: any) {
    await this.migrateLegacyCache(
      settings[`storage_${GroupManagementStorageKeys.MANAGED_GROUPS}`]
    );

    let managedGroups: ManagedGroup[];
    try {
      // Refetched once a day. A failed fetch isn't cached as "no groups": the
      // last known list is used, and the next page load tries again
      managedGroups = await getOrFetch(
        this,
        GroupManagementStorageKeys.MANAGED_GROUPS,
        this.fetchDelay,
        () => this.fetchManagedGroups(),
        this.settingsService
      );
    } catch {
      this.logger.warn("Couldn't fetch managed groups; will retry later");
      return;
    }

    const address = location.href;
    if (address.includes("/member.php?action=profile")) {
      if (managedGroups.length > 0) {
        this.appendGroupManagementButtons(managedGroups);
      }
    }
  }

  /**
   * Older versions cached `{ groups, lastFetchTime }`. Convert it to the
   * `{ value, fetchedAt }` shape getOrFetch reads, so upgrading neither
   * refetches early nor loses the fallback list.
   */
  private async migrateLegacyCache(stored: unknown): Promise<void> {
    const legacy = stored as LegacyManagedGroupsCache | null | undefined;
    if (
      !legacy ||
      typeof legacy !== "object" ||
      !Array.isArray(legacy.groups)
    ) {
      return;
    }
    const fetchedAt = Number(legacy.lastFetchTime) || 0;
    await this.settingsService.setStorageItem(
      this,
      GroupManagementStorageKeys.MANAGED_GROUPS,
      fetchedAt ? { value: legacy.groups, fetchedAt } : null
    );
  }

  /**
   * Fetch the groups the user leads from showgroups.php.
   * Rejects if the page couldn't be fetched or has no group list.
   */
  private async fetchManagedGroups(): Promise<ManagedGroup[]> {
    // Shared with WhosOnlineSorting, so a page running both fetches it once
    const doc = await fetchSharedDocument(SHOWGROUPS_URL);

    const container = doc.querySelector(
      ".groupContainer"
    ) as HTMLElement | null;
    if (!container) {
      // Logged out, error page, or layout change - not a real "no groups"
      throw new Error("showgroups.php has no group list");
    }

    const managedGroups: ManagedGroup[] = [];

    // Iterate direct children of .groupContainer
    const children = Array.from(container.children) as HTMLElement[];
    for (const child of children) {
      const manageAnchor = child.querySelector(
        ".groupControls > a"
      ) as HTMLAnchorElement | null;

      if (!manageAnchor) {
        continue; // Not a managed group
      }

      // Extract groupId from href (e.g., managegroup.php?gid=71)
      const href = manageAnchor.getAttribute("href") || "";
      let groupId: number | null = null;
      try {
        const absolute = new URL(href, "https://hackforums.net/");
        const gidStr = absolute.searchParams.get("gid");
        if (gidStr) {
          groupId = parseInt(gidStr, 10);
        }
      } catch (_) {
        // Fallback parse if URL construction fails
        const parts = href.split("gid=");
        if (parts.length > 1) {
          const gidStr = parts[1].split("&")[0];
          const parsed = parseInt(gidStr, 10);
          if (!isNaN(parsed)) {
            groupId = parsed;
          }
        }
      }

      if (groupId === null || isNaN(groupId)) {
        continue;
      }

      // Extract groupName from .groupName text content (first non-empty line)
      const nameEl = child.querySelector(".groupName") as HTMLElement | null;
      if (!nameEl) {
        continue;
      }
      const rawText = (nameEl.textContent || "").trim();
      const groupName =
        rawText
          .split("\n")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)[0] || "";

      if (!groupName) {
        continue;
      }

      managedGroups.push({ groupId, groupName });
    }

    return managedGroups;
  }

  private appendGroupManagementButtons(managedGroups: ManagedGroup[]) {
    const existing = document.getElementById("hfx-managed-groups");
    if (existing) return;

    // Find the container and the first pro-adv-card within it
    const container = document.querySelector(
      ".pro-adv-content-info"
    ) as HTMLElement | null;
    if (!container) return;

    const firstCard = container.querySelector(
      ":scope > .pro-adv-card"
    ) as HTMLElement | null;
    if (!firstCard) return;

    const profileUsername = Util.getProfileUsername() || "this user";

    // Build our card
    const card = document.createElement("div");
    card.id = "hfx-managed-groups";
    const separator = document.createElement("hr");
    separator.style.margin = "10px 0px";
    card.appendChild(separator);

    // Title row
    const titleRow = document.createElement("div");
    titleRow.setAttribute(
      "style",
      "padding: 4px 12px; margin-top: 5px; color: #fff;"
    );
    titleRow.innerHTML = "<span><strong>HFX Group Management</strong></span>";
    card.appendChild(titleRow);

    // Rows for each managed group with action button
    for (const group of managedGroups) {
      const isMember = this.isMemberOfGroup(group.groupName);
      const row = document.createElement("div");
      row.setAttribute("style", "padding: 4px 12px;");

      // textContent never parses HTML, so the name doesn't need escaping
      const nameEl = document.createElement("strong");
      nameEl.textContent = `${group.groupName || ""}:`;
      row.appendChild(nameEl);

      const toggleMembershipButton = document.createElement("button");
      toggleMembershipButton.type = "button";
      toggleMembershipButton.textContent = isMember
        ? "Remove User"
        : "Add User";
      toggleMembershipButton.setAttribute(
        "style",
        "margin-left: 10px; padding: 2px 8px; font-size: 12px; cursor: pointer;"
      );
      toggleMembershipButton.addEventListener("click", () => {
        if (isMember) {
          if (confirm(`HFX: Remove ${profileUsername} from ${group.groupName}?`))
            this.removeGroupMember(group.groupId);
        } else this.addGroupMember(group.groupId);
      });
      row.appendChild(toggleMembershipButton);

      const blacklistButton = document.createElement("button");
      blacklistButton.type = "button";
      blacklistButton.textContent = "Blacklist User";
      blacklistButton.setAttribute(
        "style",
        "margin-left: 10px; padding: 2px 8px; font-size: 12px; cursor: pointer;"
      );
      blacklistButton.addEventListener("click", () => {
        if (isMember)
          alert(
            "HFX: User is already a member of the group. Please remove them before blacklisting."
          );
        else if (
          confirm(`HFX: Blacklist ${profileUsername} from ${group.groupName}?`)
        )
          this.blacklistGroupUser(group.groupId);
      });
      row.appendChild(blacklistButton);

      card.appendChild(row);
    }

    // Append to bottom of profile card - would a new card be better?
    // (Only our card - passing nextSibling here used to pull the card's
    // neighbour inside it too)
    firstCard.append(card);
  }

  private isMemberOfGroup(groupName: string) {
    const container = document.querySelector(
      ".pro-adv-groups-group"
    ) as HTMLElement | null;
    if (!container) return false;

    const spans = container.querySelectorAll("span");
    for (const span of Array.from(spans)) {
      const img = span.querySelector("img") as HTMLImageElement | null;
      if (!img) continue;
      const title = img.getAttribute("title") || "";
      if (title.toLowerCase() === groupName.toLowerCase()) return true;
    }

    return false;
  }

  private addGroupMember(groupId: number) {
    const postKey = Util.getUserPostKey() || "";
    const profileUsername = Util.getProfileUsername() || "";
    const body = new URLSearchParams({
      my_post_key: postKey,
      action: "do_add",
      gid: String(groupId),
      username: profileUsername,
    });

    fetch("/managegroup.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "same-origin",
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.text();
      })
      .then(() => location.reload())
      .catch(console.error);
  }

  private removeGroupMember(groupId: number) {
    const profileUserId = Util.getProfileUserId();
    const postKey = Util.getUserPostKey() || "";
    const body = new URLSearchParams();
    body.set("my_post_key", postKey);
    body.set("action", "do_manageusers");
    body.set("gid", String(groupId));
    body.append(`removeuser[${profileUserId}]`, String(profileUserId));

    fetch("/managegroup.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "same-origin",
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.text();
      })
      .then(() => location.reload())
      .catch(console.error);
  }

  private blacklistGroupUser(groupId: number) {
    const postKey = Util.getUserPostKey() || "";
    const profileUsername = Util.getProfileUsername() || "";

    const body = new URLSearchParams({
      my_post_key: postKey,
      action: "do_blacklist_add", // do_blacklist_remove is inverse
      gid: String(groupId),
      username: profileUsername,
    });

    fetch("/managegroup.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "same-origin",
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.text();
      })
      .then(() => location.reload())
      .catch(console.error);
  }
}

export default new GroupManagement();
