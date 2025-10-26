import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
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

class GroupManagement extends Feature {
  constructor() {
    super({
      section: Groups,
      name: "Group Management",
      enabled: false,
      description:
        "GROUP LEADERS ONLY: Easily add, remove, and blacklist group members directly from their profile.",
      additionalSections: new SectionArray(new Section(["/member.php"], [])),
      storageItems: [
        {
          id: GroupManagementStorageKeys.MANAGED_GROUPS,
          description: "Map of groups that the user is a leader of.",
          defaultValue: { groups: [], lastFetchTime: 0 },
        },
      ],
    });
  }

  async run(settings: any) {
    const STORAGE_KEYS = {
      MANAGED_GROUPS: `storage_${GroupManagementStorageKeys.MANAGED_GROUPS}`,
    };

    const lastFetchTime = settings[STORAGE_KEYS.MANAGED_GROUPS]?.lastFetchTime;
    if (!lastFetchTime || lastFetchTime < Date.now() - 24 * 60 * 60 * 1000) {
      Logger.debug("Fetching managed groups again");
      const newManagedGroups = await this.fetchManagedGroups();
      this.settingsService.setStorageItem(
        this,
        GroupManagementStorageKeys.MANAGED_GROUPS,
        { groups: newManagedGroups, lastFetchTime: Date.now() }
      );
      settings[STORAGE_KEYS.MANAGED_GROUPS] = {
        groups: newManagedGroups,
        lastFetchTime: Date.now(),
      };
    } else {
      Logger.debug(
        `No need to fetch managed groups again until ${new Date(
          lastFetchTime + 24 * 60 * 60 * 1000
        ).toLocaleString()}`
      );
    }

    const address = location.href;
    if (address.includes("/member.php?action=profile")) {
      const managedGroups: ManagedGroup[] =
        settings[STORAGE_KEYS.MANAGED_GROUPS]?.groups || [];
      if (Array.isArray(managedGroups) && managedGroups.length > 0) {
        this.appendGroupManagementButtons(managedGroups);
      }
    }
  }

  private async fetchManagedGroups(): Promise<ManagedGroup[]> {
    const url = "https://hackforums.net/showgroups.php";

    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      const container = doc.querySelector(
        ".groupContainer"
      ) as HTMLElement | null;
      if (!container) {
        return [];
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
    } catch (e) {
      return [];
    }
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
      const safeName = (group.groupName || "")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const nameEl = document.createElement("strong");
      nameEl.textContent = `${safeName}:`;
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
        if (isMember) this.removeGroupMember(group.groupId);
        else this.addGroupMember(group.groupId);
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
        else this.blacklistUser(group.groupId);
      });
      row.appendChild(blacklistButton);

      card.appendChild(row);
    }

    // Append to bottom of profile card - would a new card be better?
    firstCard.append(card, firstCard.nextSibling);
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

  private getProfileUsername() {
    const container = document.querySelector(
      ".pro-adv-content-info"
    ) as HTMLElement | null;
    if (!container) return null;

    const firstCard = container.querySelector(
      ":scope > .pro-adv-card"
    ) as HTMLElement | null;
    if (!firstCard) return null;

    const nameEl = firstCard.querySelector(".largetext") as HTMLElement | null;
    const text = nameEl?.textContent?.trim() || "";
    return text || null;
  }

  private getProfileUserId() {
    return window.location.href.replace(/[^0-9]/g, "") || 0;
  }

  private addGroupMember(groupId: number) {
    const postKey = Util.getUserPostKey();
    const profileUsername = this.getProfileUsername();
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
    const profileUserId = this.getProfileUserId();
    const postKey = Util.getUserPostKey();
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

  private blacklistUser(groupId: number) {
    const postKey = Util.getUserPostKey();
    const profileUsername = this.getProfileUsername();

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
