import HackGame from "./HackGame";
import SelectorManager from "../../core/SelectorManager";

const trackerOnly = {
  showBatteryPercent: false,
  showBatterRechargeTime: false,
  showMedalofHonorTracker: true,
  showLeaderboardShortcut: false,
  showLogsShortcut: false,
};

const renderGameProfile = ({ level = "Level: 10", xp = "1,234 / 2,100" } = {}) => {
  document.body.innerHTML = `
    <table><tbody id="game_content_currentpage">
      <tr><td></td></tr>
      <tr><td>
        <div class="gtable">
          <div></div>
          <div><div class="gtd tcenter">${level}</div></div>
        </div>
        <div class="game-profile-player gboxshadow">
          <div></div>
          <div>
            <div></div>
            <div><span>${xp}</span></div>
          </div>
          <div>
            <div id="progress-bar"><div id="progress-bar-percentage"></div></div>
            <span class="tinytext"></span>
          </div>
        </div>
      </td></tr>
    </tbody></table>`;
};

describe("HackGame", () => {
  it("shows Medal of Honor progress from the level and XP", () => {
    renderGameProfile();

    HackGame.run(trackerOnly);

    // Level 10 = 10,000 xp, plus 1,234 into the current level
    const tracker = document.getElementById("HFXProgressBar");
    expect(tracker?.getAttribute("title")).toBe("Medal of Honor Progress: 4%");
    expect(tracker?.parentElement?.querySelector(".tinytext")?.textContent).toBe(
      "11,234 / 250,000 xp"
    );
  });

  it("skips the tracker and reports the selector when the level is missing", () => {
    renderGameProfile();
    document.querySelector(".gtable")!.remove();

    HackGame.run(trackerOnly);

    expect(document.getElementById("HFXProgressBar")).toBeNull();
    expect(document.body.textContent).not.toContain("NaN");
    expect(
      SelectorManager.getInstance()
        .getErrors()
        .some((error) => error.feature === "Hack Game Additions")
    ).toBe(true);
  });

  it("skips the tracker when the level text can't be parsed", () => {
    renderGameProfile({ level: "Level: ??" });

    HackGame.run(trackerOnly);

    expect(document.getElementById("HFXProgressBar")).toBeNull();
  });

  it("adds the logs and leaderboard shortcuts in the original order", () => {
    document.body.innerHTML = `<div class="game-top-right-icons"><a href="existing"></a></div>`;

    HackGame.run({
      ...trackerOnly,
      showMedalofHonorTracker: false,
      showLeaderboardShortcut: true,
      showLogsShortcut: true,
    });

    const hrefs = Array.from(
      document.querySelectorAll(".game-top-right-icons > a")
    ).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "gamecp.php?action=logs",
      "gamecp.php?action=leaderboard&type=1",
      "existing",
    ]);
    expect(
      document.querySelector("i.hficon-drawer-paper2")?.getAttribute("title")
    ).toBe("Logs");
  });
});
