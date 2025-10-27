import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import { Util } from "../../core/Util";
import Profile from "../../sections/Profile";

enum BanReasonStorageKeys {
  BAN_REASONS = "banReasons",
}

interface BanReason {
  banReason: string;
  bannedByUID: number;
  bannedByUsername: string;
  bannedAt: string;
  expiresAt: string;
}

/**
 * This feature shows ban reasons on profiles banned in the last month.
 *
 * NOTES:
 * - In order to save background requests, the ban reasons are cached in local storage.
 * - The ban reasons are cached in base64 encoded format to avoid quote limits with chrome's local storage.
 * - If "Resource::kQuotaBytesPerItem quota exceeded" errors are thrown, consider alternative caching solutions / remove the caching altogether.
 */
class BanReason extends Feature {
  constructor() {
    super({
      section: Profile,
      name: "Ban Reason",
      enabled: true,
      description:
        "Shows ban reasons on profiles. Only shows on profiles banned in the last month. Ban reasons are cached to avoid excessive background requests.",
      storageItems: [
        {
          id: "banReasons",
          description: "Ban reason map",
          defaultValue: "", // Base64-encoded map
        },
      ],
    });
  }

  run(settings: any) {
    const STORAGE_KEYS = {
      BAN_REASONS: `storage_${BanReasonStorageKeys.BAN_REASONS}`,
    };
    const storedRaw = settings[STORAGE_KEYS.BAN_REASONS] as string;
    let storedBanReasons: Record<number, BanReason> = {};
    if (typeof storedRaw === "string" && storedRaw.length > 0) {
      const decoded = this.decodeBase64<Record<number, BanReason>>(storedRaw);
      storedBanReasons = decoded || {};
    }
    const profileUserId = Util.getProfileUserId();
    const isBanned = this.isUserBanned();
    if (!isBanned) return;

    if (storedBanReasons[profileUserId]) {
      Logger.debug(`Ban reason found in cache for user ${profileUserId}`);
      this.appendBanReason(storedBanReasons[profileUserId]);
    } else {
      Logger.debug(
        `Ban reason not found in cache for user ${profileUserId}, querying...`
      );
      this.queryBanReason()
        .then((banReasonMap) => {
          // Persist the map for reuse
          this.settingsService.setStorageItem(
            this,
            BanReasonStorageKeys.BAN_REASONS,
            this.encodeBase64(banReasonMap)
          );

          if (banReasonMap[profileUserId]) {
            this.appendBanReason(banReasonMap[profileUserId]);
          }
        })
        .catch(() => {
          // Silent fail – nothing to append
        });
    }
  }

  private async queryBanReason(): Promise<Record<number, BanReason>> {
    const url = "https://hackforums.net/bans.php";
    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const rows = Array.from(
        doc.querySelectorAll("table.tborder tr.mobile-no-padding")
      );

      const banMap: Record<number, BanReason> = {};

      rows.forEach((row) => {
        const usernameLink = row.querySelector(
          "td:nth-child(1) a[href*='uid=']"
        ) as HTMLAnchorElement | null;
        if (!usernameLink) return;

        const uidParam = new URL(usernameLink.href).searchParams.get("uid");
        const uid = parseInt(uidParam || "0", 10);
        if (!uid) return;

        // const username = (usernameLink.textContent || "").trim();

        const reasonCell = row.querySelector(
          "td:nth-child(2)"
        ) as HTMLElement | null;
        const banReasonText = (
          reasonCell?.innerText ||
          reasonCell?.textContent ||
          ""
        )
          .replace(/\u00A0/g, " ")
          .trim();

        const bannedByLink = row.querySelector(
          "td:nth-child(3) a[href*='uid=']"
        ) as HTMLAnchorElement | null;
        let bannedByUID = 0;
        let bannedByUsername = "";
        if (bannedByLink) {
          const staffUidParam = new URL(bannedByLink.href).searchParams.get(
            "uid"
          );
          bannedByUID = parseInt(staffUidParam || "0", 10);
          bannedByUsername = (bannedByLink.textContent || "").trim();
        } else {
          const bannedByCell = row.querySelector(
            "td:nth-child(3)"
          ) as HTMLElement | null;
          bannedByUsername = (
            bannedByCell?.innerText ||
            bannedByCell?.textContent ||
            ""
          )
            .replace(/\u00A0/g, " ")
            .trim();
        }

        const bannedAtRaw = (
          row.querySelector("td:nth-child(4)") as HTMLElement | null
        )?.textContent?.trim();
        const unbanRaw = (
          row.querySelector("td:nth-child(5)") as HTMLElement | null
        )?.textContent?.trim();

        const bannedAt = this.formatBanDateString(bannedAtRaw || "");
        const expiresAt = this.formatUnbanDateString(unbanRaw || "");

        banMap[uid] = {
          banReason: banReasonText,
          bannedByUID,
          bannedByUsername,
          bannedAt,
          expiresAt,
        } as BanReason;
      });

      return banMap;
    } catch (e) {
      Logger.error("Failed to parse ban reasons");
      return {};
    }
  }

  private appendBanReason(banReason: BanReason) {
    const firstCard = document.querySelector(
      ".pro-adv-content-info > .pro-adv-card"
    ) as HTMLElement | null;
    if (!firstCard) return;

    const existing = firstCard.querySelector("[data-hfx-ban-reason='true']");
    if (existing) existing.remove();

    const block = document.createElement("div");
    block.setAttribute("data-hfx-ban-reason", "true");
    block.className = "smalltext";

    const wrapper = document.createElement("div");
    wrapper.setAttribute("style", "padding: 4px 12px; margin-top: 8px;");

    const hr = document.createElement("hr");
    hr.setAttribute("style", "margin: 6px 0;");
    wrapper.appendChild(hr);

    const title = document.createElement("div");
    title.innerHTML = "<strong>Ban Information</strong>";
    wrapper.appendChild(title);

    const reasonEl = document.createElement("div");
    reasonEl.innerHTML = `<strong>Reason:</strong> ${this.escapeHtml(
      banReason.banReason
    )}`;
    wrapper.appendChild(reasonEl);

    const bannedByEl = document.createElement("div");
    const bannedByLink = banReason.bannedByUID
      ? `<a href="https://hackforums.net/member.php?action=profile&uid=${
          banReason.bannedByUID
        }">${this.escapeHtml(banReason.bannedByUsername)}</a>`
      : this.escapeHtml(banReason.bannedByUsername || "");
    bannedByEl.innerHTML = `<strong>Banned By:</strong> ${bannedByLink}`;
    wrapper.appendChild(bannedByEl);

    const bannedAtEl = document.createElement("div");
    bannedAtEl.innerHTML = `<strong>Ban Date:</strong> ${this.escapeHtml(
      banReason.bannedAt || ""
    )}`;
    wrapper.appendChild(bannedAtEl);

    const unbanEl = document.createElement("div");
    unbanEl.innerHTML = `<strong>Unban Date:</strong> ${this.escapeHtml(
      banReason.expiresAt || ""
    )}`;
    wrapper.appendChild(unbanEl);

    block.appendChild(wrapper);
    firstCard.appendChild(block);
  }

  private encodeBase64(obj: any): string {
    try {
      const json = JSON.stringify(obj);
      const bytes = new TextEncoder().encode(json);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch {
      return "";
    }
  }

  private decodeBase64<T>(b64: string): T | null {
    try {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  private formatBanDateString(text: string): string {
    const trimmed = (text || "").trim();
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    if (lower === "today" || lower === "yesterday") {
      const now = new Date();
      const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (lower === "yesterday") base.setDate(base.getDate() - 1);
      return base.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return trimmed;
  }

  private formatUnbanDateString(text: string): string {
    const trimmed = (text || "").trim();
    if (!trimmed) return "";
    if (trimmed.toLowerCase() === "never") return "Never";
    return this.formatBanDateString(trimmed);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  private isUserBanned() {
    const container = document.querySelector(
      ".pro-adv-content-info"
    ) as HTMLElement | null;
    if (!container) return null;

    const firstCard = container.querySelector(
      ":scope > .pro-adv-card"
    ) as HTMLElement | null;
    if (!firstCard) return null;

    const bannedUserGroupElement = firstCard.querySelector(
      ".largetext .group7"
    ) as HTMLElement | null;
    return bannedUserGroupElement !== null;
  }
}

export default new BanReason();
