import { el } from "../../../core/Dom";
import type { CommandInfo } from "./commands";
import { SuggestionPicker, Token } from "./suggestions";

/**
 * Typing / at the start of a message lists Convo's commands with what each
 * does, filtered as you type; picking one writes it (and a space, if it takes
 * arguments).
 */

/** The command being typed: "/" and the word after it, up to the caret. */
export function commandQuery(value: string, caret: number): Token | null {
  const match = value.slice(0, caret).match(/^\/(\S*)$/);
  return match ? { start: 0, query: match[1] } : null;
}

/** Commands whose name starts with the query first, then those containing it. */
export function matchCommands(
  commands: CommandInfo[],
  query: string
): CommandInfo[] {
  const needle = query.toLowerCase();
  const starts = commands.filter((command) =>
    command.name.slice(1).startsWith(needle)
  );
  const contains = commands.filter(
    (command) =>
      !starts.includes(command) && command.name.slice(1).includes(needle)
  );
  return [...starts, ...contains];
}

/** Replace the typed command word with the command; returns the new caret too. */
export function applyCommand(
  value: string,
  caret: number,
  command: CommandInfo
): { value: string; caret: number } {
  // The whole first word, including any of it after the caret
  const end = caret + (value.slice(caret).match(/^\S*/)?.[0].length ?? 0);
  const after = value.slice(end);
  const space = command.args && !/^\s/.test(after) ? " " : "";
  const text = `${command.name}${space}`;
  return {
    value: `${text}${after}`,
    caret: text.length + (command.args && space === "" ? 1 : 0),
  };
}

export class CommandPicker extends SuggestionPicker<CommandInfo> {
  constructor(
    input: HTMLTextAreaElement,
    /** The commands for this chat; read each time the list opens. */
    commands: () => CommandInfo[],
    /** The input's text changed by picking a command. */
    onInsert: () => void
  ) {
    super(
      input,
      {
        label: "Commands",
        optionClass: "hfx-gc-command",
        find: commandQuery,
        match: (query) => matchCommands(commands(), query),
        apply: (value, _token, caret, command) =>
          applyCommand(value, caret, command),
        render: (command) => [
          el("span", { class: "hfx-gc-command-usage" }, command.usage),
          el("span", { class: "hfx-gc-command-about" }, command.about),
        ],
        // A command typed in full runs on Enter, as without the list
        enterSends: (command, token) =>
          `/${token.query.toLowerCase()}` === command.name,
      },
      onInsert
    );
  }
}
