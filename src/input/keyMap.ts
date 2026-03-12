import type { GameEvent } from "../engine/types.js";

interface InkKey {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  pageDown: boolean;
  pageUp: boolean;
  return: boolean;
  escape: boolean;
  ctrl: boolean;
  shift: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  meta: boolean;
}

/**
 * Maps raw keyboard input to a GameEvent.
 *
 * Tab, Escape are handled at screen level (restart / menu).
 * Backspace / Delete → DELETE_CHAR or DELETE_WORD.
 * Printable characters → INSERT_CHAR.
 */
export function mapKeyToEvent(
  input: string,
  key: InkKey,
): GameEvent | null {
  const now = performance.now();

  // Tab, Escape, Enter handled at screen level
  if (key.tab) return null;
  if (key.escape) return null;
  if (key.return) return null;

  // Backspace or Delete key → delete character/word
  if (key.backspace || key.delete) {
    if (key.ctrl || key.meta) {
      return { type: "DELETE_WORD" };
    }
    return { type: "DELETE_CHAR" };
  }

  // Also catch raw backspace/delete characters some terminals send
  if (input === "\x7f" || input === "\x08") {
    return { type: "DELETE_CHAR" };
  }

  // Ignore arrow keys and other control keys
  if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow) return null;
  if (key.pageDown || key.pageUp) return null;

  // Ctrl combos (except ctrl+backspace handled above)
  if (key.ctrl) return null;

  // Printable character
  if (input.length === 1) {
    return { type: "INSERT_CHAR", char: input, now };
  }

  return null;
}
