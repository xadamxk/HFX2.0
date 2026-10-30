import { el } from "../../../core/Dom";
import type { CommandRequest } from "./ConvoClient";
import { HELPBOT_UID, toInt, wasNotDelivered } from "./ConvoClient";
import { ConvoStorage, updateConvoStorage } from "./convoStorage";
import { renderTrustedHtml } from "./formatMessage";
import { GLOBAL_PARTY } from "./GlobalRoomClient";

/**
 * HF Convo's slash commands, run the way convo.php's preSendScan
 * (convo_1d.js) runs them. Some are answered in the page (/help, /markup,
 * /flip hide, /embed hide…), some are their own socket events (/stats,
 * /rain, /send, /leave, a moderator's /ban), and the rest (/flip 100,
 * /jackpot play, /roll, /price, /votekick…) are sent as ordinary messages
 * for the server to run.
 */

export type Command =
  /** Not one convo.php runs itself: send it as a message. */
  | { kind: "message" }
  /** Answered here; only the user sees it. */
  | { kind: "reply"; text: string }
  /** A convo.php setting, saved where convo.php keeps it. */
  | {
      kind: "setting";
      set: Partial<ConvoStorage>;
      clear?: (keyof ConvoStorage)[];
      text: string;
    }
  | { kind: "stats" }
  | { kind: "rain"; players: number; bytes: number }
  | { kind: "send-bytes"; username: string }
  | { kind: "leave" }
  | { kind: "ban"; uid: string; period: string };

const lines = (...rows: [string, string][]) =>
  rows.map(([usage, about]) => `${usage}\n    ${about}`).join("\n");

/** A command as /help and the / picker list it. */
export interface CommandInfo {
  /** What's typed, e.g. "/flip". */
  name: string;
  usage: string;
  about: string;
  /** It takes arguments, so picking it leaves a space after it. */
  args?: boolean;
}

/** convo.php's /help list, in its order. */
export const COMMANDS: CommandInfo[] = [
  { name: "/stats", usage: "/stats", about: "Check your statistics." },
  {
    name: "/flip",
    usage: "/flip WAGER",
    about: "Place a Bytes wager on a coin flip.",
    args: true,
  },
  { name: "/help", usage: "/help", about: "View a list of Convo commands." },
  {
    name: "/jackpot",
    usage: "/jackpot play",
    about: "Wager 25 Bytes for a chance to win the jackpot.",
    args: true,
  },
  { name: "/leave", usage: "/leave", about: "Leave a group convo." },
  {
    name: "/markup",
    usage: "/markup",
    about: "A cheatsheet for Convo markup.",
  },
  {
    name: "/price",
    usage: "/price CRYPTO_SYMBOL",
    about: "View the price of cryptocurrencies.",
    args: true,
  },
  {
    name: "/rain",
    usage: "/rain MEMBER_COUNT BYTES_EACH",
    about: "Send a number of Bytes to a set of members.",
    args: true,
  },
  {
    name: "/roll",
    usage: "/roll LOW:HIGH",
    about: "A random number between (and including) LOW and HIGH.",
    args: true,
  },
  {
    name: "/send",
    usage: "/send USERNAME",
    about: "Send Bytes to a member.",
    args: true,
  },
  {
    name: "/embed",
    usage: "/embed show/hide",
    about: "Show or hide image and video embeds.",
    args: true,
  },
  {
    name: "/votekick",
    usage: "/votekick UID",
    about: "Three members can votekick for a 30 minute Convo ban.",
    args: true,
  },
];

const BAN: CommandInfo = {
  name: "/ban",
  usage: "/ban UID TIME",
  about: "Ban a member from global chat (TIME -1: permanent).",
  args: true,
};

/**
 * The commands that do something in a kind of chat: /leave only in groups
 * (and global chat, where it closes the window), /rain only in global chat
 * (HF: "Join public chat first."), /ban only for global chat moderators.
 */
export function commandsFor(
  chat: "dm" | "group" | "global",
  moderator = false
): CommandInfo[] {
  const list = COMMANDS.filter(
    (command) =>
      (command.name !== "/leave" || chat !== "dm") &&
      (command.name !== "/rain" || chat === "global")
  ).map((command) =>
    command.name === "/leave" && chat === "global"
      ? { ...command, about: "Leave the global chat and close its window." }
      : command
  );
  return chat === "global" && moderator ? [...list, BAN] : list;
}

const helpRows = (commands: CommandInfo[]): [string, string][] =>
  commands.map(({ usage, about }) => [usage, about]);

export const HELP_TEXT = lines(
  ...helpRows(COMMANDS.slice(0, 3)),
  ["@username@", "Tags a member."],
  ...helpRows(COMMANDS.slice(3))
);

const MODERATOR_HELP = lines(...helpRows([BAN]));

export const MARKUP_TEXT = lines(
  ["*text* or _text_", "Italic"],
  ["**text** or __text__", "Bold"],
  ["***text*** or ___text___", "Bold and italic"],
  ["~~text~~", "Strikethrough"]
);

const FLIP_HELP = lines(
  ["/flip WAGER", "Place a Bytes wager on a coin flip."],
  ["/flip WAGER heads (H) or tails (T)", "Pick a side. Default: random."],
  ["/flip hide", "Hide other people's flips."],
  ["/flip hide MIN", "Hide other people's flips under MIN Bytes."],
  ["/flip show", "Show other people's flips."]
);

const JACKPOT_HELP = lines(
  ["/jackpot play", "Play a game of Jackpot for 25 Bytes."],
  ["/jackpot play NUM_GAMES", "Play NUM_GAMES games for 25 Bytes each."],
  ["/jackpot hide", "Hide other people's jackpot plays."],
  ["/jackpot show", "Show other people's jackpot plays."]
);

const RAIN_HELP = lines([
  "/rain MEMBER_COUNT BYTES_EACH",
  "Send a number of Bytes to a set of members.",
]);

const EMBED_HELP = lines(
  ["/embed show", "Show message embeds."],
  ["/embed hide", "Hide message embeds."]
);

/**
 * What convo.php would do with a message, word for word as preSendScan
 * reads it (split on single spaces, so "/flip  5" is just a message).
 * `moderator`: the user moderates global chat (convo_group_level > 0).
 */
export function parseCommand(text: string, moderator = false): Command {
  const message = text.trim();
  if (!message.startsWith("/")) return { kind: "message" };
  const words = message.split(" ");
  const first = words[0].toLowerCase();
  const helpAsked = words.length === 1 || ["?", "help"].includes(words[1]);

  if (words.length === 1) {
    if (first === "/help") {
      return {
        kind: "reply",
        text: moderator ? `${HELP_TEXT}\n${MODERATOR_HELP}` : HELP_TEXT,
      };
    }
    if (first === "/markup") return { kind: "reply", text: MARKUP_TEXT };
    if (first === "/leave") return { kind: "leave" };
  } else if (first === "/ban" && moderator) {
    if (words.length !== 3)
      return { kind: "reply", text: "Bad ban format. /ban UID TIME (-1 perm)" };
    return { kind: "ban", uid: words[1], period: words[2] };
  }

  switch (first) {
    case "/flip":
      if (helpAsked) return { kind: "reply", text: FLIP_HELP };
      if (words[1].toLowerCase() === "hide") {
        const min = words.length >= 3 ? toInt(words[2]) : 0;
        return {
          kind: "setting",
          set:
            min > 0
              ? { hideFlip: true, hideWagersUnder: min }
              : { hideFlip: true },
          text:
            min > 0
              ? `You will only see flips ${min} and greater.`
              : "You will only see your own flips.",
        };
      }
      if (words[1] === "show") {
        return {
          kind: "setting",
          set: {},
          clear: ["hideFlip", "hideWagersUnder"],
          text: "You will see all player flips.",
        };
      }
      return { kind: "message" };
    case "/jackpot":
      if (helpAsked) return { kind: "reply", text: JACKPOT_HELP };
      if (words[1] === "hide") {
        return {
          kind: "setting",
          set: { hideJackpot: true },
          text: "You will only see your own jackpot plays.",
        };
      }
      if (words[1] === "show") {
        return {
          kind: "setting",
          set: {},
          clear: ["hideJackpot"],
          text: "You will see all jackpot plays.",
        };
      }
      return ["play", "fund"].includes(words[1])
        ? { kind: "message" }
        : { kind: "reply", text: "Invalid Jackpot command!" };
    case "/rain":
      if (words.length >= 3 && !helpAsked) {
        return {
          kind: "rain",
          players: toInt(words[1]),
          bytes: toInt(words[2]),
        };
      }
      return { kind: "reply", text: RAIN_HELP };
    case "/stats":
      return { kind: "stats" };
    case "/send":
      if (words.length < 2) return { kind: "message" };
      return words[1].length >= 3
        ? { kind: "send-bytes", username: words[1] }
        : { kind: "reply", text: "Usernames are at least 3 characters." };
    case "/embed":
      if (words[1] === "show") {
        return {
          kind: "setting",
          set: { hideEmbeds: false },
          text: "Any new message embeds will be shown.",
        };
      }
      if (words[1] === "hide") {
        return {
          kind: "setting",
          set: { hideEmbeds: true },
          text: "Any new message embeds will be hidden.",
        };
      }
      return { kind: "reply", text: EMBED_HELP };
  }
  return { kind: "message" };
}

/** The fields of the server's answers that commands read. */
type Answer =
  | { uid?: unknown; mid?: unknown; message?: unknown; username?: unknown }
  | null
  | undefined;

/** /stats' answer: a Stanley message for party -1 with no message id. */
const isStatsReply = (payload: unknown) => {
  const answer = payload as Answer;
  return (
    toInt(answer?.uid) === HELPBOT_UID &&
    !answer?.mid &&
    typeof answer?.message === "string"
  );
};

type SocketCommand = Extract<
  Command,
  { kind: "stats" | "rain" | "send-bytes" | "leave" | "ban" }
>;

/** The socket event convo.php emits for a command, in the chat `partyId`. */
export function commandRequest(
  command: SocketCommand,
  partyId: number
): CommandRequest {
  switch (command.kind) {
    case "stats":
      return {
        event: "convo_checkstats",
        data: { uid: HELPBOT_UID },
        reply: { event: "convo_receivemessage", accept: isStatsReply },
      };
    case "rain":
      return {
        event: "convo_rain",
        data: { players: command.players, myps: command.bytes },
        mutation: true,
      };
    case "send-bytes":
      return {
        event: "convo_fetchUIDByUsername",
        data: {
          username: command.username,
          party: partyId,
          action: "convo_processByteSend",
        },
        reply: { event: "convo_processByteSend" },
      };
    case "leave":
      return { event: "do_leave_convo", data: partyId };
    case "ban":
      return {
        event: "convo_group_kick",
        data: { uid: command.uid, period: command.period },
      };
  }
}

/** Where a command runs: the chat window it was typed in. */
export interface CommandTarget {
  /** -1 for global chat, the group id, or the DM's party id. */
  partyId: number;
  origin: string;
  /** Send a command's event through this chat's socket. */
  request(request: CommandRequest): Promise<unknown>;
  /** Show something only the user sees (a command's answer). */
  reply(content: string | Node): void;
  /** A short notice (an error). */
  notice(text: string): void;
  /** /leave: leave this chat. Throws if it can't. */
  leave(): Promise<void>;
  open?: (url: string) => Window | null;
}

/**
 * Run a command typed in a chat window. Resolves false when it certainly
 * didn't run (so the text can go back in the input).
 */
export async function runCommand(
  command: Exclude<Command, { kind: "message" }>,
  target: CommandTarget
): Promise<boolean> {
  try {
    switch (command.kind) {
      case "reply":
        target.reply(command.text);
        return true;
      case "setting":
        updateConvoStorage(command.set, command.clear);
        target.reply(command.text);
        return true;
      case "leave":
        await target.leave();
        return true;
      case "stats": {
        const answer = (await target.request(
          commandRequest(command, target.partyId)
        )) as Answer;
        // In the global chat it shows in the room, as on convo.php
        if (
          typeof answer?.message === "string" &&
          target.partyId !== GLOBAL_PARTY
        ) {
          target.reply(renderTrustedHtml(answer.message, target.origin));
        }
        return true;
      }
      case "rain":
        // HF only rains on a socket that joined the global room
        if (target.partyId !== GLOBAL_PARTY) {
          target.reply("/rain only works in the global chat.");
          return true;
        }
        await target.request(commandRequest(command, target.partyId));
        return true;
      case "send-bytes": {
        const user = (await target.request(
          commandRequest(command, target.partyId)
        )) as Answer;
        const uid = toInt(user?.uid);
        if (uid > 0) openDonate(target, uid, String(user?.username ?? ""));
        return true;
      }
      default:
        await target.request(commandRequest(command, target.partyId));
        return true;
    }
  } catch (error) {
    target.notice(String((error as Error)?.message || "Command failed."));
    return !wasNotDelivered(error);
  }
}

/**
 * HF's donate form for /send, in a new tab (convo.php shows it in a popup).
 * If the browser blocks the tab, the user gets a link instead.
 */
function openDonate(target: CommandTarget, uid: number, username: string) {
  const url = `${target.origin}/myps.php?action=donate&uid=${uid}`;
  const tab = (target.open ?? ((href) => window.open(href, "_blank")))(url);
  if (tab) {
    tab.opener = null;
    return;
  }
  target.reply(
    el("a", { href: url, target: "_blank", rel: "noopener" }, [
      `Send Bytes to ${username || `user ${uid}`}`,
    ])
  );
}

/**
 * Show a command's answer in a window's notice area until dismissed, unlike
 * the notices that fade.
 */
export function showReply(notice: HTMLElement, content: string | Node): void {
  const close = el(
    "button",
    {
      type: "button",
      class: "hfx-chat-reply-close",
      title: "Dismiss",
      "aria-label": "Dismiss",
    },
    "×"
  );
  close.addEventListener("click", () => {
    notice.hidden = true;
  });
  notice.replaceChildren(
    el("div", { class: "hfx-chat-reply-text" }, [content]),
    close
  );
  notice.classList.add("hfx-chat-reply");
  notice.hidden = false;
}
