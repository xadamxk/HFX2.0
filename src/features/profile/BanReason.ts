import { Feature } from "../../core/Feature";
import { appendChildren, el, ElChild } from "../../core/Dom";
import { Util } from "../../core/Util";
import Profile from "../../sections/Profile";

enum BanReasonStorageKeys {
  BAN_REASONS = "banReasons",
}

interface BanInfo {
  banReason: string;
  bannedByUID: number;
  bannedByUsername: string;
  bannedAt: string;
  expiresAt: string;
}

interface CachedBanInfo extends BanInfo {
  /** When this ban was last listed on bans.php (ms since epoch). */
  seenAt: number;
}

interface BanReasonCache {
  /** When bans.php was last fetched (ms since epoch). 0 forces a refetch. */
  fetchedAt: number;
  map: Record<number, CachedBanInfo>;
}

/** How long a bans.php snapshot is trusted before refetching. */
const CACHE_TTL_MS = 60 * 60 * 1000;
/** Bans that haven't been listed on bans.php for this long are dropped. */
const ENTRY_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * This feature shows ban reasons on profiles banned in the last month.
 *
 * NOTES:
 * - bans.php only lists the last month of bans. The parsed page is cached in local storage as
 *   `{ fetchedAt, map }` and only refetched once it is older than CACHE_TTL_MS.
 * - While the snapshot is fresh, a banned profile missing from the map is a remembered miss:
 *   it wasn't on bans.php, so refetching wouldn't find it either.
 * - Each fetch is merged into the map, so bans that have dropped off bans.php keep showing
 *   until they haven't been listed for ENTRY_MAX_AGE_MS.
 * - Older versions stored the map base64-encoded; that value is converted once on first read.
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
          defaultValue: { fetchedAt: 0, map: {} } as BanReasonCache,
        },
      ],
    });
  }

  run(settings: any) {
    const STORAGE_KEYS = {
      BAN_REASONS: `storage_${BanReasonStorageKeys.BAN_REASONS}`,
    };
    const storedRaw = settings[STORAGE_KEYS.BAN_REASONS];
    const cache = this.readCache(storedRaw);
    if (typeof storedRaw === "string") {
      // Replace the legacy base64 value so it is only decoded once
      this.saveCache(cache);
    }

    const profileUserId = Util.getProfileUserId();
    if (!profileUserId) return;
    const profileCard = this.getProfileCard();
    if (!profileCard || !this.isUserBanned(profileCard)) return;

    const cached = cache.map[profileUserId];
    if (cached) {
      this.logger.debug(`Ban reason found in cache for user ${profileUserId}`);
      this.appendBanReason(profileCard, cached);
    }

    if (Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      if (!cached) {
        this.logger.debug(
          `User ${profileUserId} wasn't on bans.php when it was last fetched, skipping query`
        );
      }
      return;
    }

    this.logger.debug("Ban reason cache is stale, querying...");
    this.queryBanReason()
      .then((banReasonMap) => {
        if (!banReasonMap) return;
        this.saveCache(this.mergeBanReasons(cache, banReasonMap));

        // Re-render in case the ban changed since it was cached
        if (banReasonMap[profileUserId]) {
          this.appendBanReason(profileCard, banReasonMap[profileUserId]);
        }
      })
      .catch(() => {
        // Silent fail – nothing to append
      });
  }

  /**
   * Normalize the stored value into a cache. The legacy base64-encoded map has
   * no fetch time, so it is kept but treated as stale.
   */
  private readCache(storedRaw: unknown): BanReasonCache {
    if (typeof storedRaw === "string") {
      const legacyMap =
        storedRaw.length > 0
          ? this.decodeBase64<Record<number, BanInfo>>(storedRaw)
          : null;
      const now = Date.now();
      const map: Record<number, CachedBanInfo> = {};
      Object.entries(legacyMap ?? {}).forEach(([uid, banReason]) => {
        map[Number(uid)] = { ...banReason, seenAt: now };
      });
      return { fetchedAt: 0, map };
    }

    const stored = storedRaw as Partial<BanReasonCache> | null | undefined;
    if (stored && typeof stored === "object" && stored.map) {
      return { fetchedAt: Number(stored.fetchedAt) || 0, map: stored.map };
    }
    return { fetchedAt: 0, map: {} };
  }

  /**
   * Merge a freshly fetched bans.php map into the cache, replacing entries for
   * users listed again and dropping ones not listed for ENTRY_MAX_AGE_MS.
   */
  private mergeBanReasons(
    cache: BanReasonCache,
    banReasonMap: Record<number, BanInfo>
  ): BanReasonCache {
    const now = Date.now();
    const map: Record<number, CachedBanInfo> = {};
    Object.entries(cache.map).forEach(([uid, banReason]) => {
      if (now - (banReason.seenAt || 0) < ENTRY_MAX_AGE_MS) {
        map[Number(uid)] = banReason;
      }
    });
    Object.entries(banReasonMap).forEach(([uid, banReason]) => {
      map[Number(uid)] = { ...banReason, seenAt: now };
    });
    return { fetchedAt: now, map };
  }

  private saveCache(cache: BanReasonCache) {
    this.settingsService
      .setStorageItem(this, BanReasonStorageKeys.BAN_REASONS, cache)
      .catch(() => {
        this.logger.error("Failed to save ban reasons");
      });
  }

  /** Returns null when bans.php couldn't be fetched or parsed. */
  private async queryBanReason(): Promise<Record<number, BanInfo> | null> {
    const url = "https://hackforums.net/bans.php";
    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const rows = this.querySelectorAll(
        "table.tborder tr.mobile-no-padding",
        doc
      );

      const banMap: Record<number, BanInfo> = {};

      rows.forEach((row) => {
        const usernameLink = this.querySelector<HTMLAnchorElement>(
          "td:nth-child(1) a[href*='uid=']",
          row,
          true
        );
        if (!usernameLink) return;

        const uidParam = new URL(usernameLink.href).searchParams.get("uid");
        const uid = parseInt(uidParam || "0", 10);
        if (!uid) return;

        // const username = (usernameLink.textContent || "").trim();

        const reasonCell = this.querySelector<HTMLElement>(
          "td:nth-child(2)",
          row,
          true
        );
        const banReasonText = (
          reasonCell?.innerText ||
          reasonCell?.textContent ||
          ""
        )
          .replace(/\u00A0/g, " ")
          .trim();

        const bannedByLink = this.querySelector<HTMLAnchorElement>(
          "td:nth-child(3) a[href*='uid=']",
          row,
          true
        );
        let bannedByUID = 0;
        let bannedByUsername = "";
        if (bannedByLink) {
          const staffUidParam = new URL(bannedByLink.href).searchParams.get(
            "uid"
          );
          bannedByUID = parseInt(staffUidParam || "0", 10);
          bannedByUsername = (bannedByLink.textContent || "").trim();
        } else {
          const bannedByCell = this.querySelector<HTMLElement>(
            "td:nth-child(3)",
            row,
            true
          );
          bannedByUsername = (
            bannedByCell?.innerText ||
            bannedByCell?.textContent ||
            ""
          )
            .replace(/\u00A0/g, " ")
            .trim();
        }

        const bannedAtRaw = this.querySelector(
          "td:nth-child(4)",
          row,
          true
        )?.textContent?.trim();
        const unbanRaw = this.querySelector(
          "td:nth-child(5)",
          row,
          true
        )?.textContent?.trim();

        const bannedAt = this.formatBanDateString(bannedAtRaw || "");
        const expiresAt = this.formatUnbanDateString(unbanRaw || "");

        banMap[uid] = {
          banReason: banReasonText,
          bannedByUID,
          bannedByUsername,
          bannedAt,
          expiresAt,
        } as BanInfo;
      });

      return banMap;
    } catch (e) {
      this.logger.error("Failed to parse ban reasons");
      return null;
    }
  }

  private appendBanReason(firstCard: HTMLElement, banReason: BanInfo) {
    const existing = this.querySelector(
      "[data-hfx-ban-reason='true']",
      firstCard,
      true
    );
    if (existing) existing.remove();

    const block = document.createElement("div");
    block.setAttribute("data-hfx-ban-reason", "true");
    block.className = "smalltext";

    const wrapper = document.createElement("div");
    wrapper.setAttribute("style", "padding: 4px 12px; margin-top: 8px;");

    const hr = document.createElement("hr");
    hr.setAttribute("style", "margin: 6px 0;");
    wrapper.appendChild(hr);

    const row = (label: string, value: ElChild) =>
      el("div", null, [el("strong", null, label), " ", value]);

    const bannedBy = banReason.bannedByUID
      ? el(
          "a",
          {
            href: `https://hackforums.net/member.php?action=profile&uid=${Number(
              banReason.bannedByUID
            )}`,
          },
          banReason.bannedByUsername || ""
        )
      : banReason.bannedByUsername || "";

    appendChildren(wrapper, [
      el("div", null, el("strong", null, "Ban Information")),
      row("Reason:", banReason.banReason || ""),
      row("Banned By:", bannedBy),
      row("Ban Date:", banReason.bannedAt || ""),
      row("Unban Date:", banReason.expiresAt || ""),
    ]);

    block.appendChild(wrapper);
    firstCard.appendChild(block);
  }

  /** Only used to read the legacy base64-encoded cache. */
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

  /** The profile's first info card, which holds the username and the ban block. */
  private getProfileCard() {
    return this.querySelector<HTMLElement>(
      ".pro-adv-content-info > .pro-adv-card"
    );
  }

  private isUserBanned(profileCard: HTMLElement) {
    return this.selectorExists(".largetext .group7", profileCard, true);
  }
}

export default new BanReason();
