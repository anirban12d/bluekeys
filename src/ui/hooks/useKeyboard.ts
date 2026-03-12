import { useInput } from "ink";
import type { GameEvent, QuickRestart } from "../../engine/types.js";
import { mapKeyToEvent } from "../../input/keyMap.js";

export function useKeyboard(
  dispatch: (event: GameEvent) => void,
  isActive: boolean,
  onRestart?: () => void,
  onMenu?: () => void,
  quickRestart?: QuickRestart,
) {
  useInput((input, key) => {
    // Esc always goes to menu (unless in no-quit mode where onMenu is undefined)
    if (key.escape) {
      if (onMenu) {
        onMenu();
      }
      return;
    }

    // Tab always restarts (new words)
    if (key.tab) {
      if (onRestart) {
        onRestart();
      }
      return;
    }

    // Custom quick restart key (if set to something other than tab)
    if (onRestart && quickRestart && quickRestart !== "off" && quickRestart !== "tab") {
      if (
        (quickRestart === "esc" && key.escape) ||
        (quickRestart === "enter" && key.return)
      ) {
        onRestart();
        return;
      }
    }

    if (!isActive) return;

    const event = mapKeyToEvent(input, key);
    if (event) dispatch(event);
  });
}
