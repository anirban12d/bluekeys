import type { GameState, GameEvent, Command } from "../engine/types.js";
import { reduce } from "../engine/gameEngine.js";

export interface Store {
  getState(): GameState;
  dispatch(event: GameEvent): Command[];
  subscribe(fn: () => void): () => void;
}

export function createStore(initialState: GameState): Store {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState() {
      return state;
    },

    dispatch(event: GameEvent): Command[] {
      const result = reduce(state, event);
      state = result.state;
      for (const listener of listeners) {
        listener();
      }
      return result.commands;
    },

    subscribe(fn: () => void): () => void {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}
