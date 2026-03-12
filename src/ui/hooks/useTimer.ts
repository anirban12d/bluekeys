import type { GameState } from "../../engine/types.js";

export function useTimerDisplay(state: GameState): string {
  if (state.config.mode === "time") {
    const remaining = Math.max(0, state.config.timeLimit - state.timing.elapsedSeconds);
    return String(remaining);
  }
  return String(state.timing.elapsedSeconds);
}
