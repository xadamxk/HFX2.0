import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import Games from "../../sections/Games";

class HackGame extends Feature {
  constructor() {
    super({
      section: Games,
      name: "Hack Game Additions",
      enabled: true,
      description: "Adds various additions to the Hack Game.",
      configurables: [
        new Checkbox({
          id: "showBatteryPercent",
          label: "Battery Percent",
          description: "Show the battery percentage next to the battery icon.",
          default: true,
        }),
        new Checkbox({
          id: "showBatterRechargeTime",
          label: "Battery Recharge Time",
          description: "Show absolute timestamp for battery full charge.",
          default: true,
        }),
        new Checkbox({
          id: "showMedalofHonorTracker",
          label: "Medal of Honor Tracker",
          description: "Show progress bar toward level 50.",
          default: true,
        }),
        new Checkbox({
          id: "showLeaderboardShortcut",
          label: "Leaderboard Shortcut",
          description: "Show leaderboard shortcut in game header.",
          default: true,
        }),
        new Checkbox({
          id: "showLogsShortcut",
          label: "Logs Shortcut",
          description: "Show logs shortcut in game header.",
          default: true,
        }),
      ],
    });
  }

  run(settings: any) {
    if (settings?.showBatteryPercent) {
      this.showBatteryPercent();
    }
    if (settings?.showBatterRechargeTime) {
      this.showBatteryRechargeTime();
    }
    if (settings?.showMedalofHonorTracker) {
      this.showMedalofHonorTracker();
    }
    // Each shortcut is inserted first, so the last one added appears leftmost
    if (settings?.showLeaderboardShortcut) {
      this.addHeaderShortcut(
        "gamecp.php?action=leaderboard&type=1",
        "hficon-medal-empty",
        "Leaderboard"
      );
    }
    if (settings?.showLogsShortcut) {
      this.addHeaderShortcut(
        "gamecp.php?action=logs",
        "hficon-drawer-paper2",
        "Logs"
      );
    }
  }

  private showBatteryPercent() {
    if (!document.getElementById("game_content_currentpage")) return;

    const container = document.querySelector(".game-top-right-icons");
    if (!container) return;

    const anchors = Array.from(container.children).filter(
      (el) => el.tagName === "A"
    );
    const fifthAnchor = anchors[4];
    const batteryPercent = fifthAnchor
      ? parseInt(
          (fifthAnchor.getAttribute("title") || "").replace("%", ""),
          10
        ) || 0
      : 0;

    const icon = container.querySelector("a[data-tooltip*='Power:'] > i");
    const color = icon ? getComputedStyle(icon).color : "";
    const title = icon?.getAttribute("title") || "";
    const tooltip = icon?.getAttribute("data-tooltip") || "";

    const wrapper = document.createElement("div");

    const link = document.createElement("a");
    link.href = "gamecp.php?action=battery";
    if (title) link.setAttribute("title", title);
    if (tooltip) link.setAttribute("data-tooltip", tooltip);

    const span = document.createElement("span");
    span.id = "HFXBatteryPercent";
    span.textContent = `${batteryPercent}%`;
    span.style.color = color;
    span.style.paddingLeft = "10px";
    span.style.fontSize = "14px";
    span.style.fontWeight = "bold";

    wrapper.append(link, span);
    container.appendChild(wrapper);
  }

  private showBatteryRechargeTime() {
    const gameContentElement = document.getElementById(
      "game_content_currentpage"
    );
    if (!gameContentElement) return;

    const rechargeTimeElement = gameContentElement.querySelector(".smart-time");
    if (
      rechargeTimeElement &&
      gameContentElement.textContent.includes("Full Charge:")
    ) {
      const extractedRechargeTime =
        rechargeTimeElement.getAttribute("title") || "";
      const span = document.createElement("span");
      span.id = "HFXFullChargeTime";
      span.textContent = `(${extractedRechargeTime})`;
      rechargeTimeElement.insertAdjacentElement("afterend", span);
    }
  }

  private showMedalofHonorTracker() {
    const determineLevelXp = (level: number) => {
      return Math.pow(level, 2) * 100;
    };
    const numberWithCommas = (number: number) => {
      return new Intl.NumberFormat("en-US").format(number);
    };
    const getWholePercent = (percentFor: number, percentOf: number) => {
      return Math.round((percentFor / percentOf) * 100);
    };

    if (document.getElementById("progress-bar-percentage")) {
      const goal = 250000;

      // Use the SelectorManager-backed lookups so markup changes are reported
      const levelEl = this.querySelector(
        "#game_content_currentpage > tr:nth-child(2) > td > div.gtable > div:nth-child(2) > div.gtd.tcenter"
      );
      const currentlevel = parseInt(
        (levelEl?.textContent || "").replace("Level: ", "").trim(),
        10
      );

      const xpEl = this.querySelector(
        "#game_content_currentpage > tr:nth-child(2) > td > div.game-profile-player.gboxshadow > div:nth-child(2) > div:nth-child(2) > span"
      );
      const currentlevelXP = parseInt(
        (xpEl?.textContent || "").replace(/\s.*/, "").replace(/,/g, ""),
        10
      );

      // Don't show a broken tracker ("NaN / 250,000 xp") if the values can't be read
      if (!Number.isFinite(currentlevel) || !Number.isFinite(currentlevelXP)) {
        Logger.warn(
          `${this.name}: could not read level or XP for the Medal of Honor tracker.`
        );
        return;
      }

      const totalXP = determineLevelXp(currentlevel) + currentlevelXP;

      let wholePercent = getWholePercent(totalXP, goal);
      if (wholePercent >= 100) wholePercent = 100;

      const progressBar = document.getElementById("progress-bar");
      const barParent = progressBar && progressBar.parentElement;
      const target = document.querySelector(".game-profile-player");
      if (!barParent || !target) return;

      const cloneParent = barParent.cloneNode(true) as HTMLElement;
      target.appendChild(cloneParent);

      const hfxBar = cloneParent.firstElementChild as HTMLElement;
      if (!hfxBar) return;
      hfxBar.id = "HFXProgressBar";

      const hfxBarPct = hfxBar.firstElementChild as HTMLElement;
      if (!hfxBarPct) return;
      hfxBarPct.id = "HFXProgressBarPercentage";

      hfxBar.setAttribute("title", `Medal of Honor Progress: ${wholePercent}%`);
      hfxBar.style.borderRadius = "6px";

      hfxBarPct.setAttribute(
        "title",
        `Medal of Honor Progress: ${wholePercent}%`
      );
      Object.assign(hfxBarPct.style, {
        width: `${wholePercent}%`,
        transition: "0.1s",
        backgroundColor: "#e2ba2f",
        boxShadow: "inset 0px 0px 3px 1px #ffffff12",
        border: "1px solid #292929",
        height: "11px",
        borderRadius: "6px",
      });

      const tiny = cloneParent.querySelector(".tinytext");
      if (tiny) {
        tiny.textContent = `${numberWithCommas(totalXP)} / ${numberWithCommas(
          goal
        )} xp`;
      }
    }
  }

  private addHeaderShortcut(href: string, iconClass: string, title: string) {
    document.querySelectorAll(".game-top-right-icons").forEach((container) => {
      const a = document.createElement("a");
      a.href = href;

      const i = document.createElement("i");
      i.className = iconClass;
      i.setAttribute("title", title);
      Object.assign(i.style, {
        // marginLeft: "6px",
        fontSize: "24px",
        color: "#ababab",
      });
      i.addEventListener("mouseenter", () => {
        i.style.color = "#4d2f5d";
      });
      i.addEventListener("mouseleave", () => {
        i.style.color = "#ababab";
      });

      a.appendChild(i);
      container.insertBefore(a, container.firstChild);
    });
  }
}

export default new HackGame();
