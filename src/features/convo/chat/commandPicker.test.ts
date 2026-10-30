import {
  applyCommand,
  CommandPicker,
  commandQuery,
  matchCommands,
} from "./commandPicker";
import { COMMANDS, commandsFor } from "./commands";

const names = (list: { name: string }[]) => list.map((command) => command.name);
const command = (name: string) => COMMANDS.find((c) => c.name === name)!;

describe("commandQuery", () => {
  it("is the / word at the start of the message, up to the caret", () => {
    expect(commandQuery("/", 1)).toEqual({ start: 0, query: "" });
    expect(commandQuery("/fl", 3)).toEqual({ start: 0, query: "fl" });
    expect(commandQuery("/flip", 3)).toEqual({ start: 0, query: "fl" });
    expect(commandQuery("/flip 100", 9)).toBeNull();
    expect(commandQuery("hi /flip", 8)).toBeNull();
    expect(commandQuery(" /flip", 6)).toBeNull();
    expect(commandQuery("", 0)).toBeNull();
  });
});

describe("matchCommands", () => {
  it("lists every command for a bare /, then ones starting with, then containing, the query", () => {
    expect(names(matchCommands(COMMANDS, ""))).toEqual(names(COMMANDS));
    expect(names(matchCommands(COMMANDS, "r"))).toEqual([
      "/rain",
      "/roll",
      "/markup",
      "/price",
    ]);
    expect(names(matchCommands(COMMANDS, "FL"))).toEqual(["/flip"]);
    expect(matchCommands(COMMANDS, "zzz")).toEqual([]);
  });
});

describe("applyCommand", () => {
  it("writes the command, with a space when it takes arguments", () => {
    expect(applyCommand("/fl", 3, command("/flip"))).toEqual({
      value: "/flip ",
      caret: 6,
    });
    expect(applyCommand("/he", 3, command("/help"))).toEqual({
      value: "/help",
      caret: 5,
    });
    // The rest of the word goes; what follows it stays
    expect(applyCommand("/flx 100", 2, command("/flip"))).toEqual({
      value: "/flip 100",
      caret: 6,
    });
  });
});

describe("commandsFor", () => {
  it("offers /leave and /rain only where they do something, and /ban only to moderators", () => {
    expect(names(commandsFor("dm"))).not.toContain("/rain");
    expect(names(commandsFor("group"))).not.toContain("/rain");
    expect(names(commandsFor("global"))).toContain("/rain");
    expect(names(commandsFor("dm"))).not.toContain("/leave");
    expect(names(commandsFor("group"))).toContain("/leave");
    expect(names(commandsFor("group", true))).not.toContain("/ban");
    expect(names(commandsFor("global"))).not.toContain("/ban");
    expect(names(commandsFor("global", true))).toContain("/ban");
  });

  it("describes /leave for the chat it's in", () => {
    const about = (chat: "group" | "global") =>
      commandsFor(chat).find((c) => c.name === "/leave")!.about;
    expect(about("group")).toBe("Leave a group convo.");
    expect(about("global")).toBe("Leave the global chat and close its window.");
    expect(command("/leave").about).toBe("Leave a group convo.");
  });
});

describe("CommandPicker", () => {
  let input: HTMLTextAreaElement;
  let picker: CommandPicker;
  let onInsert: jest.Mock;

  const type = (value: string) => {
    input.value = value;
    input.setSelectionRange(value.length, value.length);
    input.dispatchEvent(new Event("input"));
  };
  const key = (name: string) => {
    const event = new KeyboardEvent("keydown", { key: name, cancelable: true });
    return { used: picker.handleKey(event), event };
  };
  const options = () =>
    Array.from(picker.root.querySelectorAll('[role="option"]'));

  beforeEach(() => {
    document.body.innerHTML = "";
    input = document.createElement("textarea");
    document.body.appendChild(input);
    onInsert = jest.fn();
    picker = new CommandPicker(input, () => commandsFor("dm"), onInsert);
    document.body.appendChild(picker.root);
    input.focus();
  });

  it("lists commands with what they do on /, filtered as you type", () => {
    type("/");
    expect(picker.isOpen).toBe(true);
    expect(options()).toHaveLength(commandsFor("dm").length);
    expect(options()[0].textContent).toBe("/statsCheck your statistics.");
    type("/fl");
    expect(options().map((o) => o.textContent)).toEqual([
      "/flip WAGERPlace a Bytes wager on a coin flip.",
    ]);
    type("/flip 1");
    expect(picker.isOpen).toBe(false);
  });

  it("inserts the highlighted command on Enter or Tab", () => {
    // In a DM there is no /rain: /roll, then /markup and /price
    type("/r");
    expect(key("ArrowDown").used).toBe(true);
    expect(key("ArrowUp").used).toBe(true);
    const enter = key("Enter");
    expect(enter.used).toBe(true);
    expect(enter.event.defaultPrevented).toBe(true);
    expect(input.value).toBe("/roll ");
    expect(input.selectionStart).toBe(6);
    expect(picker.isOpen).toBe(false);
    expect(onInsert).toHaveBeenCalled();

    type("/mar");
    key("Tab");
    expect(input.value).toBe("/markup");
  });

  it("lets Enter through when the command is typed in full, so it runs", () => {
    type("/help");
    expect(picker.isOpen).toBe(true);
    const enter = key("Enter");
    expect(enter.used).toBe(false);
    expect(enter.event.defaultPrevented).toBe(false);
    expect(picker.isOpen).toBe(false);
    expect(input.value).toBe("/help");
  });

  it("closes on Escape and picks on click", () => {
    type("/");
    key("Escape");
    expect(picker.isOpen).toBe(false);
    type("/st");
    (options()[0] as HTMLElement).click();
    expect(input.value).toBe("/stats");
  });
});
