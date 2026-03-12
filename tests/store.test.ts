import { describe, it, expect, vi } from "vitest";
import { createStore } from "../src/state/store.js";
import { createInitialState } from "../src/engine/gameEngine.js";
import { DEFAULT_CONFIG } from "../src/config/difficulty.js";

const words = ["hello", "world"];

function makeStore() {
  const state = createInitialState(DEFAULT_CONFIG, words);
  return createStore(state);
}

describe("createStore", () => {
  it("returns initial state via getState", () => {
    const store = makeStore();
    const state = store.getState();
    expect(state.phase).toBe("ready");
    expect(state.words.words).toEqual(words);
  });

  it("dispatch updates state", () => {
    const store = makeStore();
    store.dispatch({ type: "INSERT_CHAR", char: "h", now: 1000 });
    const state = store.getState();
    expect(state.phase).toBe("active");
    expect(state.input.current).toBe("h");
  });

  it("dispatch returns commands", () => {
    const store = makeStore();
    const commands = store.dispatch({ type: "INSERT_CHAR", char: "h", now: 1000 });
    expect(commands).toContainEqual({ type: "START_TIMER" });
  });

  it("subscribe notifies on dispatch", () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.dispatch({ type: "INSERT_CHAR", char: "h", now: 1000 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe stops notifications", () => {
    const store = makeStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.dispatch({ type: "INSERT_CHAR", char: "h", now: 1000 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("multiple subscribers all get notified", () => {
    const store = makeStore();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    store.subscribe(listener1);
    store.subscribe(listener2);
    store.dispatch({ type: "INSERT_CHAR", char: "h", now: 1000 });
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it("dispatch processes multiple events sequentially", () => {
    const store = makeStore();
    store.dispatch({ type: "INSERT_CHAR", char: "h", now: 1000 });
    store.dispatch({ type: "INSERT_CHAR", char: "e", now: 1050 });
    store.dispatch({ type: "INSERT_CHAR", char: "l", now: 1100 });
    expect(store.getState().input.current).toBe("hel");
  });
});
