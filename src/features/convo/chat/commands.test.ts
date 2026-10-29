import {
  commandRequest,
  HELP_TEXT,
  parseCommand,
  runCommand,
  showReply,
} from "./commands";
import type { CommandTarget } from "./commands";
import { SendError } from "./ConvoClient";
import {
  hiddenBySettings,
  readConvoStorage,
  updateConvoStorage,
  writeConvoStorage,
} from "./convoStorage";

/** The text of a command answered here, "" for any other. */
const replyText = (text: string, moderator = false) => {
  const command = parseCommand(text, moderator);
  return command.kind === "reply" ? command.text : "";
};

describe("parseCommand", () => {
  it("leaves messages and commands the server runs as messages", () => {
    for (const text of [
      "hello",
      "hi /flip",
      "/flip 100",
      "/flip 100 H",
      "/jackpot play",
      "/jackpot fund 5",
      "/roll 1:6",
      "/price BTC",
      "/votekick 5",
      "/send",
      // preSendScan splits on single spaces
      "/flip  hide",
      // /help and /leave only on their own
      "/help me",
      "/leave now",
      // Only moderators' /ban is a command
      "/ban 5 60",
      "/unknown",
    ]) {
      expect([text, parseCommand(text).kind]).toEqual([text, "message"]);
    }
  });

  it("answers help and markup here", () => {
    expect(parseCommand("/help")).toEqual({ kind: "reply", text: HELP_TEXT });
    expect(parseCommand("/HELP").kind).toBe("reply");
    expect(replyText("/help", true)).toContain("/ban UID");
    expect(replyText("/markup")).toContain("~~text~~");
    expect(replyText("/flip")).toContain("/flip hide MIN");
    expect(replyText("/flip help")).toContain("/flip show");
    expect(replyText("/jackpot ?")).toContain("NUM_GAMES");
    expect(parseCommand("/jackpot spin")).toEqual({
      kind: "reply",
      text: "Invalid Jackpot command!",
    });
    expect(replyText("/rain 5")).toContain("BYTES_EACH");
    expect(replyText("/embed")).toContain("/embed hide");
  });

  it("turns settings into convo.php's storage changes", () => {
    expect(parseCommand("/flip hide")).toMatchObject({
      kind: "setting",
      set: { hideFlip: true },
      text: "You will only see your own flips.",
    });
    expect(parseCommand("/flip HIDE 500")).toMatchObject({
      set: { hideFlip: true, hideWagersUnder: 500 },
      text: "You will only see flips 500 and greater.",
    });
    expect(parseCommand("/flip show")).toMatchObject({
      set: {},
      clear: ["hideFlip", "hideWagersUnder"],
    });
    expect(parseCommand("/jackpot hide")).toMatchObject({
      set: { hideJackpot: true },
    });
    expect(parseCommand("/jackpot show")).toMatchObject({
      clear: ["hideJackpot"],
    });
    expect(parseCommand("/embed hide")).toMatchObject({
      set: { hideEmbeds: true },
    });
    expect(parseCommand("/embed show")).toMatchObject({
      set: { hideEmbeds: false },
    });
  });

  it("maps the rest to their socket events", () => {
    expect(parseCommand("/stats")).toEqual({ kind: "stats" });
    expect(parseCommand("/stats please")).toEqual({ kind: "stats" });
    expect(parseCommand("/rain 5 10")).toEqual({
      kind: "rain",
      players: 5,
      bytes: 10,
    });
    expect(parseCommand("/send Mix")).toEqual({
      kind: "send-bytes",
      username: "Mix",
    });
    expect(parseCommand("/send Al").kind).toBe("reply");
    expect(parseCommand("/leave")).toEqual({ kind: "leave" });
    expect(parseCommand("/ban 5 60", true)).toEqual({
      kind: "ban",
      uid: "5",
      period: "60",
    });
    expect(parseCommand("/ban 5", true)).toEqual({
      kind: "reply",
      text: "Bad ban format. /ban UID TIME (-1 perm)",
    });

    expect(commandRequest({ kind: "rain", players: 5, bytes: 10 }, -1)).toEqual(
      {
        event: "convo_rain",
        data: { players: 5, myps: 10 },
        mutation: true,
      }
    );
    expect(commandRequest({ kind: "stats" }, 7)).toMatchObject({
      event: "convo_checkstats",
      data: { uid: 1337 },
    });
    expect(commandRequest({ kind: "send-bytes", username: "Mix" }, 7)).toEqual({
      event: "convo_fetchUIDByUsername",
      data: { username: "Mix", party: 7, action: "convo_processByteSend" },
      reply: { event: "convo_processByteSend" },
    });
    expect(commandRequest({ kind: "leave" }, 48)).toEqual({
      event: "do_leave_convo",
      data: 48,
    });
    expect(commandRequest({ kind: "ban", uid: "5", period: "-1" }, -1)).toEqual(
      { event: "convo_group_kick", data: { uid: "5", period: "-1" } }
    );
  });
});

describe("runCommand", () => {
  let target: CommandTarget & {
    request: jest.Mock;
    reply: jest.Mock;
    notice: jest.Mock;
    leave: jest.Mock;
    open: jest.Mock;
  };

  beforeEach(() => {
    target = {
      partyId: 7,
      origin: "https://hackforums.net",
      request: jest.fn(async () => undefined),
      reply: jest.fn(),
      notice: jest.fn(),
      leave: jest.fn(async () => undefined),
      open: jest.fn(() => ({ opener: {} }) as unknown as Window),
    };
  });

  it("shows /stats' answer", async () => {
    target.request.mockResolvedValue({
      uid: 1337,
      message: "Bytes Balance: 1.00\nFlip Count: 0",
    });
    await expect(runCommand({ kind: "stats" }, target)).resolves.toBe(true);
    expect(target.reply.mock.calls[0][0].textContent).toBe(
      "Bytes Balance: 1.00\nFlip Count: 0"
    );
  });

  it("leaves /stats' answer to the room in the global chat", async () => {
    target.request.mockResolvedValue({
      uid: 1337,
      message: "Bytes Balance: 1.00",
    });
    await runCommand({ kind: "stats" }, { ...target, partyId: -1 });
    expect(target.reply).not.toHaveBeenCalled();
  });

  it("opens the donate form for /send, or links it when the tab is blocked", async () => {
    target.request.mockResolvedValue({ uid: 2331053, username: "Mix" });
    await runCommand({ kind: "send-bytes", username: "Mix" }, target);
    expect(target.open).toHaveBeenCalledWith(
      "https://hackforums.net/myps.php?action=donate&uid=2331053"
    );
    expect(target.reply).not.toHaveBeenCalled();

    target.open.mockReturnValue(null);
    await runCommand({ kind: "send-bytes", username: "Mix" }, target);
    const link = target.reply.mock.calls[0][0] as HTMLAnchorElement;
    expect(link.textContent).toBe("Send Bytes to Mix");
    expect(link.href).toBe(
      "https://hackforums.net/myps.php?action=donate&uid=2331053"
    );
  });

  it("shows failures, and says whether the command may have run", async () => {
    target.request.mockRejectedValue(
      new SendError("Member not found.", "refused")
    );
    await expect(
      runCommand({ kind: "send-bytes", username: "Nobody" }, target)
    ).resolves.toBe(false);
    expect(target.notice).toHaveBeenCalledWith("Member not found.");

    target.request.mockRejectedValue(new SendError("No reply.", "unconfirmed"));
    await expect(
      runCommand({ kind: "rain", players: 5, bytes: 10 }, target)
    ).resolves.toBe(true);
  });

  it("rains only in the global chat, where HF allows it", async () => {
    await runCommand({ kind: "rain", players: 1, bytes: 50 }, target);
    expect(target.request).not.toHaveBeenCalled();
    expect(target.reply).toHaveBeenCalledWith(
      "/rain only works in the global chat."
    );
    await runCommand(
      { kind: "rain", players: 1, bytes: 50 },
      { ...target, partyId: -1 }
    );
    expect(target.request).toHaveBeenCalledWith(
      expect.objectContaining({ event: "convo_rain" })
    );
  });

  it("leaves through the window", async () => {
    await runCommand({ kind: "leave" }, target);
    expect(target.leave).toHaveBeenCalled();
    expect(target.request).not.toHaveBeenCalled();
  });
});

describe("convo.php's settings", () => {
  it("reads and updates the convoStorage cookie, keeping other settings", () => {
    let written = "";
    const jar = {
      get cookie() {
        return `a=1; convoStorage=${encodeURIComponent('{"hideFlip":true,"hideWagersUnder":5,"x":1}')}`;
      },
      set cookie(value: string) {
        written = value;
      },
    };
    expect(readConvoStorage(jar)).toEqual({
      hideFlip: true,
      hideWagersUnder: 5,
      x: 1,
    });
    updateConvoStorage(
      { hideEmbeds: true },
      ["hideFlip", "hideWagersUnder"],
      jar,
      "hackforums.net"
    );
    const [pair, ...attributes] = written.split("; ");
    expect(JSON.parse(decodeURIComponent(pair.split("=")[1]))).toEqual({
      x: 1,
      hideEmbeds: true,
    });
    expect(attributes).toEqual(
      expect.arrayContaining(["path=/", "domain=hackforums.net"])
    );
    expect(readConvoStorage({ cookie: "convoStorage=nope" })).toEqual({});
  });

  it("marks the cookie secure on https", () => {
    const jar = { cookie: "" };
    writeConvoStorage({}, jar, "hackforums.net", true);
    expect(jar.cookie).toMatch(/; secure$/);
  });

  it("hides other people's flips and jackpot plays as convo.php does", () => {
    const flip = (uid: number, text: string) =>
      hiddenBySettings({ uid, text }, 1, { hideFlip: true });
    expect(flip(2, "/flip 100")).toBe(true);
    expect(flip(1, "/flip 100")).toBe(false);
    expect(flip(2, "hello")).toBe(false);
    const under = { hideFlip: true, hideWagersUnder: 50 };
    expect(hiddenBySettings({ uid: 2, text: "/flip 10" }, 1, under)).toBe(true);
    expect(hiddenBySettings({ uid: 2, text: "/flip 50" }, 1, under)).toBe(
      false
    );
    expect(
      hiddenBySettings({ uid: 2, text: "/Jackpot play" }, 1, {
        hideJackpot: true,
      })
    ).toBe(true);
    expect(hiddenBySettings({ uid: 2, text: "/flip 10" }, 1, {})).toBe(false);
  });
});

describe("showReply", () => {
  it("shows until dismissed", () => {
    const notice = document.createElement("div");
    notice.hidden = true;
    showReply(notice, "Line one\nLine two");
    expect(notice.hidden).toBe(false);
    expect(notice.classList.contains("hfx-chat-reply")).toBe(true);
    expect(notice.querySelector(".hfx-chat-reply-text")!.textContent).toBe(
      "Line one\nLine two"
    );
    notice.querySelector<HTMLButtonElement>(".hfx-chat-reply-close")!.click();
    expect(notice.hidden).toBe(true);
  });
});
