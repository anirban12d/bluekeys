import type { KeybindingMode } from "../engine/types.js";

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

export type NavAction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "confirm"
  | "back"
  | "tab";

/**
 * Maps raw keyboard input to a navigation action based on the keybinding mode.
 *
 * Arrow keys, Enter, Escape, and Tab always work in all modes.
 * Vim mode adds: h/j/k/l for direction, q for back.
 * Emacs mode adds: Ctrl+P/N/B/F for direction, Ctrl+G for back.
 */
export function mapNavAction(
  input: string,
  key: InkKey,
  mode: KeybindingMode,
): NavAction | null {
  // Universal keys — work in all modes
  if (key.upArrow) return "up";
  if (key.downArrow) return "down";
  if (key.leftArrow) return "left";
  if (key.rightArrow) return "right";
  if (key.return) return "confirm";
  if (key.escape) return "back";
  if (key.tab) return "tab";

  // Vim: hjkl + q
  if (mode === "vim") {
    if (input === "j") return "down";
    if (input === "k") return "up";
    if (input === "h") return "left";
    if (input === "l") return "right";
    if (input === "q") return "back";
  }

  // Emacs: Ctrl+N/P/B/F + Ctrl+G
  if (mode === "emacs" && key.ctrl) {
    if (input === "\x0e") return "down";  // Ctrl+N
    if (input === "\x10") return "up";    // Ctrl+P
    if (input === "\x02") return "left";  // Ctrl+B
    if (input === "\x06") return "right"; // Ctrl+F
    if (input === "\x07") return "back";  // Ctrl+G
  }

  return null;
}
