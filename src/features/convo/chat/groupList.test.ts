import { fetchGroupList, parseGroupList } from "./groupList";

const doc = (html: string) =>
  new DOMParser().parseFromString(html, "text/html");

// The shape of convo.php's Comrades list (2026-10-20)
const row = (gid: number, name: string, unread = false) => `
  <div class="message-inbox-row-outer">
    <a href="convo.php?action=group&amp;gid=${gid}" class="message-inbox-row message_inbox_row_${gid} message_inbox_row_groupmessage${unread ? " message-inbox-details-preview-unread" : ""}">
      <div class="message-inbox-row-container">
        <div class="message-inbox-details"><div><strong>${name}</strong></div><div><span class="tinytext">time</span></div></div>
      </div>
    </a>
  </div>`;

describe("parseGroupList", () => {
  it("reads each group's id, name and unread state", () => {
    const groups = parseGroupList(
      doc(`<div id="message-inbox-list-comrades">
        ${row(48, "Quantum")}${row(52, "Pink LSZ", true)}
        <a href="convo.php?id=449981" class="message-inbox-row message_inbox_row_449981">a DM row</a>
      </div>`)
    );
    expect(groups).toEqual([
      { gid: 48, name: "Quantum", unread: false },
      { gid: 52, name: "Pink LSZ", unread: true },
    ]);
  });

  it("reads names as text", () => {
    const [group] = parseGroupList(
      doc(
        `<div id="message-inbox-list-comrades">${row(7, "&lt;b&gt;Crew&lt;/b&gt;")}</div>`
      )
    );
    expect(group.name).toBe("<b>Crew</b>");
  });

  it("throws when there's no Comrades list, so nothing empty is cached", () => {
    expect(() => parseGroupList(doc("<p>Please log in</p>"))).toThrow(
      "no Comrades list"
    );
  });
});

describe("fetchGroupList", () => {
  afterEach(() => delete (global as any).fetch);

  it("fetches /convo.php", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      text: async () =>
        `<div id="message-inbox-list-comrades">${row(48, "Quantum")}</div>`,
    }));
    (global as any).fetch = fetchMock;
    await expect(fetchGroupList("https://hackforums.net")).resolves.toEqual([
      { gid: 48, name: "Quantum", unread: false },
    ]);
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe(
      "https://hackforums.net/convo.php"
    );
  });
});
