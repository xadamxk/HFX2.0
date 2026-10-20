import WhosOnlineSorting from "./WhosOnlineSorting";

const HOUR = 60 * 60 * 1000;

const SHOWGROUPS_HTML = `
  <div class="groupName"><span><strong><span class="group4">Admins</span></strong></span></div>
  <div class="groupName"><span><strong><span class="group99">Brand New Group</span></strong></span></div>`;

const renderWhosOnline = (
  members = `<a href="#"><span class="group2">Alice</span></a>, <a href="#"><span class="group99">Bob</span></a>*, <a href="#"><span class="group4">Carol</span></a>`
) => {
  document.body.innerHTML = `
    <table><tbody id="boardstats_e">
      <tr><td class="tcat"><span class="smalltext"><strong>Who's Online</strong></span></td></tr>
      <tr><td class="trow1"><span class="smalltext">3 users active in the past 15 minutes.<br />${members}</span></td></tr>
    </tbody></table>`;
  return document.querySelector<HTMLElement>("td.trow1 > span.smalltext")!;
};

const memberNames = (cell: HTMLElement) =>
  Array.from(cell.querySelectorAll("a span")).map((span) => span.textContent);

const groupLabels = (cell: HTMLElement) =>
  Array.from(
    cell.querySelectorAll(".whosonline-sorting-group > span:first-child")
  ).map((span) => span.textContent);

const settings = (overrides: object = {}) => ({
  labelByGroup: true,
  storage_groupMap: {},
  storage_groupMapNextFetch: 0,
  ...overrides,
});

describe("WhosOnlineSorting", () => {
  let fetchMock: jest.Mock;
  let setStorageItem: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => SHOWGROUPS_HTML,
    });
    (global as any).fetch = fetchMock;
    setStorageItem = jest
      .spyOn((WhosOnlineSorting as any).settingsService, "setStorageItem")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    setStorageItem.mockRestore();
    delete (global as any).fetch;
  });

  it("fetches the group map, stores it with an expiry, and sorts by group", async () => {
    const cell = renderWhosOnline();

    await WhosOnlineSorting.run(settings());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(memberNames(cell)).toEqual(["Carol", "Bob", "Alice"]);
    expect(groupLabels(cell)).toEqual(["Admins", "Brand New Group", "Normal"]);
    expect(cell.textContent).toContain("Bob*");
    expect(setStorageItem).toHaveBeenCalledWith(
      WhosOnlineSorting,
      "groupMap",
      { group4: "Admins", group99: "Brand New Group" }
    );
    const [, , nextFetch] = setStorageItem.mock.calls.find(
      ([, id]) => id === "groupMapNextFetch"
    );
    expect(nextFetch).toBeGreaterThan(Date.now() + 23 * HOUR);
  });

  it("leaves the online list intact when the group fetch throws", async () => {
    const cell = renderWhosOnline();
    const before = cell.innerHTML;
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await WhosOnlineSorting.run(settings());

    expect(cell.innerHTML).toBe(before);
    expect(memberNames(cell)).toEqual(["Alice", "Bob", "Carol"]);
    expect(setStorageItem).not.toHaveBeenCalledWith(
      expect.anything(),
      "groupMap",
      expect.anything()
    );
  });

  it("leaves the online list intact when showgroups.php returns an error", async () => {
    const cell = renderWhosOnline();
    const before = cell.innerHTML;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => SHOWGROUPS_HTML,
    });

    await WhosOnlineSorting.run(settings());

    expect(cell.innerHTML).toBe(before);
  });

  it("does not persist an empty group map, and backs off before retrying", async () => {
    const cell = renderWhosOnline();
    const before = cell.innerHTML;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<p>You are not logged in</p>",
    });

    await WhosOnlineSorting.run(settings());

    expect(cell.innerHTML).toBe(before);
    expect(setStorageItem).not.toHaveBeenCalledWith(
      expect.anything(),
      "groupMap",
      expect.anything()
    );
    const [, , nextFetch] = setStorageItem.mock.calls.find(
      ([, id]) => id === "groupMapNextFetch"
    );
    expect(nextFetch).toBeGreaterThan(Date.now());
    expect(nextFetch).toBeLessThanOrEqual(Date.now() + HOUR);

    // Within the back-off window the next page load doesn't refetch
    fetchMock.mockClear();
    await WhosOnlineSorting.run(
      settings({ storage_groupMapNextFetch: nextFetch })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses a fresh stored map without fetching", async () => {
    const cell = renderWhosOnline();

    await WhosOnlineSorting.run(
      settings({
        storage_groupMap: { group99: "Stored Group" },
        storage_groupMapNextFetch: Date.now() + HOUR,
      })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(groupLabels(cell)).toEqual(["Admins", "Stored Group", "Normal"]);
  });

  it("refreshes a stale stored map", async () => {
    const cell = renderWhosOnline();

    await WhosOnlineSorting.run(
      settings({
        storage_groupMap: { group99: "Old Name" },
        storage_groupMapNextFetch: Date.now() - 1,
      })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(groupLabels(cell)).toEqual(["Admins", "Brand New Group", "Normal"]);
  });

  it("falls back to a stale stored map when the refresh fails", async () => {
    const cell = renderWhosOnline();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await WhosOnlineSorting.run(
      settings({
        storage_groupMap: { group99: "Old Name" },
        storage_groupMapNextFetch: Date.now() - 1,
      })
    );

    expect(memberNames(cell)).toEqual(["Carol", "Bob", "Alice"]);
    expect(groupLabels(cell)).toEqual(["Admins", "Old Name", "Normal"]);
  });

  it("does nothing when nobody is online", async () => {
    const cell = renderWhosOnline("");
    cell.innerHTML = "0 users active in the past 15 minutes.";

    await expect(WhosOnlineSorting.run(settings())).resolves.toBeUndefined();
    expect(cell.textContent).toBe("0 users active in the past 15 minutes.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when the list has no members to group", async () => {
    const cell = renderWhosOnline("");

    await expect(WhosOnlineSorting.run(settings())).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cell.querySelector("br")).not.toBeNull();
  });

  it("does nothing off the index page", async () => {
    document.body.innerHTML = "<div>Some other page</div>";

    await expect(WhosOnlineSorting.run(settings())).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists members in group order without labels when labelling is off", async () => {
    const cell = renderWhosOnline();

    await WhosOnlineSorting.run(settings({ labelByGroup: false }));

    expect(memberNames(cell)).toEqual(["Carol", "Bob", "Alice"]);
    expect(groupLabels(cell)).toEqual([]);
  });
});
