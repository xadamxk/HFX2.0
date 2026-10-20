import GroupManagement from "./GroupManagement";

const STORAGE_KEY = "storage_managedGroups";
const LEADER_GROUP = { groupId: 71, groupName: "Leaders" };

const SHOWGROUPS_HTML = `
  <div class="groupContainer">
    <div>
      <div class="groupName">Leaders</div>
      <div class="groupControls"><a href="managegroup.php?gid=71">Manage</a></div>
    </div>
    <div>
      <div class="groupName">Someone Else's</div>
    </div>
  </div>`;

const renderProfile = ({ memberOf = [] as string[], nextCard = true } = {}) => {
  window.history.pushState({}, "", "/member.php?action=profile&uid=5");
  document.body.innerHTML = `
    <div class="pro-adv-content-info">
      <div class="pro-adv-card" id="first"><span class="largetext">Target</span></div>${
        nextCard ? `<div class="pro-adv-card" id="second"></div>` : ""
      }
    </div>
    <div class="pro-adv-groups-group">
      ${memberOf.map((name) => `<span><img title="${name}" /></span>`).join("")}
    </div>`;
};

const freshCache = (groups: object[]) => ({
  [STORAGE_KEY]: { groups, lastFetchTime: Date.now() },
});

const buttonsFor = (label: string) =>
  Array.from(document.querySelectorAll("#hfx-managed-groups button")).filter(
    (button) => button.textContent === label
  ) as HTMLButtonElement[];

describe("GroupManagement", () => {
  let setStorageItem: jest.SpyInstance;
  let fetchMock: jest.Mock;
  let confirmMock: jest.Mock;

  beforeEach(() => {
    setStorageItem = jest
      .spyOn((GroupManagement as any).settingsService, "setStorageItem")
      .mockResolvedValue(undefined);
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    confirmMock = jest.fn();
    window.confirm = confirmMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetching managed groups", () => {
    beforeEach(() => {
      window.history.pushState({}, "", "/showgroups.php");
      document.body.innerHTML = "";
    });

    it("caches the groups the user leads", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => SHOWGROUPS_HTML,
      });

      await GroupManagement.run({ [STORAGE_KEY]: { groups: [], lastFetchTime: 0 } });

      expect(setStorageItem).toHaveBeenCalledWith(
        GroupManagement,
        "managedGroups",
        expect.objectContaining({ groups: [LEADER_GROUP] })
      );
    });

    it("doesn't cache a failed request as 'no groups'", async () => {
      fetchMock.mockRejectedValue(new Error("offline"));

      await GroupManagement.run({ [STORAGE_KEY]: { groups: [], lastFetchTime: 0 } });

      expect(setStorageItem).not.toHaveBeenCalled();
    });

    it("doesn't cache an error response or a page without the group list", async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      await GroupManagement.run({ [STORAGE_KEY]: { groups: [], lastFetchTime: 0 } });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => "<p>You must be logged in</p>",
      });
      await GroupManagement.run({ [STORAGE_KEY]: { groups: [], lastFetchTime: 0 } });

      expect(setStorageItem).not.toHaveBeenCalled();
    });

    it("keeps showing the previously cached groups when a refresh fails", async () => {
      renderProfile();
      fetchMock.mockRejectedValue(new Error("offline"));

      await GroupManagement.run({
        [STORAGE_KEY]: { groups: [LEADER_GROUP], lastFetchTime: 1 },
      });

      expect(document.getElementById("hfx-managed-groups")).not.toBeNull();
    });
  });

  describe("profile buttons", () => {
    it("adds the card to the bottom of the first profile card without moving its neighbour", async () => {
      renderProfile();

      await GroupManagement.run(freshCache([LEADER_GROUP]));

      const first = document.getElementById("first")!;
      const second = document.getElementById("second")!;
      expect(first.lastElementChild?.id).toBe("hfx-managed-groups");
      expect(second.parentElement?.classList.contains("pro-adv-content-info")).toBe(
        true
      );
      expect(first.textContent).not.toContain("null");
    });

    it("does nothing when the profile has no card to attach to", async () => {
      renderProfile();
      document.getElementById("first")!.remove();
      document.getElementById("second")!.remove();

      await expect(
        GroupManagement.run(freshCache([LEADER_GROUP]))
      ).resolves.toBeUndefined();
      expect(document.getElementById("hfx-managed-groups")).toBeNull();
    });

    it("shows group names with < and > as written", async () => {
      renderProfile();

      await GroupManagement.run(
        freshCache([{ groupId: 1, groupName: "<3 Coders>" }])
      );

      expect(
        document.querySelectorAll("#hfx-managed-groups strong")[1]?.textContent
      ).toBe("<3 Coders>:");
    });

    it("doesn't remove a member when the confirm is cancelled", async () => {
      renderProfile({ memberOf: ["Leaders"] });
      confirmMock.mockReturnValue(false);

      await GroupManagement.run(freshCache([LEADER_GROUP]));
      buttonsFor("Remove User")[0].click();

      expect(confirmMock).toHaveBeenCalledWith(
        expect.stringContaining("Remove Target from Leaders")
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("removes a member once the confirm is accepted", async () => {
      renderProfile({ memberOf: ["Leaders"] });
      confirmMock.mockReturnValue(true);
      fetchMock.mockReturnValue(new Promise(() => {}));

      await GroupManagement.run(freshCache([LEADER_GROUP]));
      buttonsFor("Remove User")[0].click();

      expect(fetchMock).toHaveBeenCalledWith(
        "/managegroup.php",
        expect.objectContaining({ method: "POST" })
      );
      const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
      expect(body.get("action")).toBe("do_manageusers");
    });

    it("doesn't blacklist a user when the confirm is cancelled", async () => {
      renderProfile();
      confirmMock.mockReturnValue(false);

      await GroupManagement.run(freshCache([LEADER_GROUP]));
      buttonsFor("Blacklist User")[0].click();

      expect(confirmMock).toHaveBeenCalledWith(
        expect.stringContaining("Blacklist Target from Leaders")
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("blacklists a user once the confirm is accepted", async () => {
      renderProfile();
      confirmMock.mockReturnValue(true);
      fetchMock.mockReturnValue(new Promise(() => {}));

      await GroupManagement.run(freshCache([LEADER_GROUP]));
      buttonsFor("Blacklist User")[0].click();

      const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
      expect(body.get("action")).toBe("do_blacklist_add");
    });

    it("adds a user without asking for confirmation", async () => {
      renderProfile();
      fetchMock.mockReturnValue(new Promise(() => {}));

      await GroupManagement.run(freshCache([LEADER_GROUP]));
      buttonsFor("Add User")[0].click();

      expect(confirmMock).not.toHaveBeenCalled();
      const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
      expect(body.get("action")).toBe("do_add");
    });
  });
});
