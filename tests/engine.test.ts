import { describe, it, expect } from "vitest";
import { createInitialState, reduce } from "../src/engine/gameEngine.js";
import { DEFAULT_CONFIG } from "../src/config/difficulty.js";
import type { GameConfig, GameState } from "../src/engine/types.js";

const words = ["hello", "world", "test", "type", "fast"];

function makeState(overrides?: Partial<GameConfig>): GameState {
  return createInitialState({ ...DEFAULT_CONFIG, ...overrides }, words);
}

describe("createInitialState", () => {
  it("creates state in ready phase", () => {
    const state = makeState();
    expect(state.phase).toBe("ready");
    expect(state.words.words).toEqual(words);
    expect(state.words.activeWordIndex).toBe(0);
    expect(state.input.current).toBe("");
    expect(state.input.history).toEqual([]);
  });
});

describe("reduce - INIT_TEST", () => {
  it("resets state with new words", () => {
    const state = makeState();
    const { state: next } = reduce(state, { type: "INIT_TEST", words: ["new", "words"] });
    expect(next.phase).toBe("ready");
    expect(next.words.words).toEqual(["new", "words"]);
  });
});

describe("reduce - INSERT_CHAR", () => {
  it("auto-starts on first keypress", () => {
    const state = makeState();
    const now = 1000;
    const { state: next, commands } = reduce(state, { type: "INSERT_CHAR", char: "h", now });
    expect(next.phase).toBe("active");
    expect(next.input.current).toBe("h");
    expect(commands).toContainEqual({ type: "START_TIMER" });
  });

  it("appends correct character", () => {
    let state = makeState();
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "h", now: 1000 });
    const { state: s2 } = reduce(s1, { type: "INSERT_CHAR", char: "e", now: 1050 });
    expect(s2.input.current).toBe("he");
    expect(s2.metrics.accuracy.correct).toBe(2);
    expect(s2.metrics.accuracy.incorrect).toBe(0);
  });

  it("tracks incorrect character", () => {
    let state = makeState();
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "x", now: 1000 });
    expect(s1.metrics.accuracy.incorrect).toBe(1);
  });

  it("rejects incorrect char in stopOnError=letter mode", () => {
    let state = makeState({ stopOnError: "letter" });
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "h", now: 1000 });
    const { state: s2 } = reduce(s1, { type: "INSERT_CHAR", char: "x", now: 1050 });
    // x should be rejected, current should stay "h"
    expect(s2.input.current).toBe("h");
  });

  it("space moves to next word", () => {
    let state = makeState();
    // Type "hello" then space
    let current = state;
    for (const char of "hello") {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char, now: 1000 });
      current = s;
    }
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 1100 });
    expect(afterSpace.words.activeWordIndex).toBe(1);
    expect(afterSpace.input.current).toBe("");
    expect(afterSpace.input.history).toEqual(["hello"]);
  });

  it("space does nothing when input is empty", () => {
    let state = makeState();
    // First trigger active phase
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "h", now: 1000 });
    // Delete the char
    const { state: s2 } = reduce(s1, { type: "DELETE_CHAR" });
    // Try space on empty
    const { state: s3 } = reduce(s2, { type: "INSERT_CHAR", char: " ", now: 1100 });
    expect(s3.words.activeWordIndex).toBe(0);
  });
});

describe("reduce - DELETE_CHAR", () => {
  it("removes last character", () => {
    let state = makeState();
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "h", now: 1000 });
    const { state: s2 } = reduce(s1, { type: "INSERT_CHAR", char: "e", now: 1050 });
    const { state: s3 } = reduce(s2, { type: "DELETE_CHAR" });
    expect(s3.input.current).toBe("h");
  });

  it("goes to previous word when current is empty", () => {
    let state = makeState();
    let current = state;
    for (const char of "hello") {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char, now: 1000 });
      current = s;
    }
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 1100 });
    // Now at word 1 with empty input
    const { state: backToWord0 } = reduce(afterSpace, { type: "DELETE_CHAR" });
    expect(backToWord0.words.activeWordIndex).toBe(0);
    expect(backToWord0.input.current).toBe("hello");
  });
});

describe("reduce - DELETE_WORD", () => {
  it("clears entire current input", () => {
    let state = makeState();
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "h", now: 1000 });
    const { state: s2 } = reduce(s1, { type: "INSERT_CHAR", char: "e", now: 1050 });
    const { state: s3 } = reduce(s2, { type: "DELETE_WORD" });
    expect(s3.input.current).toBe("");
  });
});

describe("reduce - TICK", () => {
  it("increments elapsed seconds", () => {
    let state = makeState();
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "h", now: 1000 });
    const { state: s2 } = reduce(s1, { type: "TICK", now: 2000 });
    expect(s2.timing.elapsedSeconds).toBe(1);
    expect(s2.metrics.wpmHistory).toHaveLength(1);
  });

  it("finishes time mode when time is up", () => {
    let state = makeState({ mode: "time", timeLimit: 2 });
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "h", now: 1000 });
    const { state: s2 } = reduce(s1, { type: "TICK", now: 2000 });
    const { state: s3, commands } = reduce(s2, { type: "TICK", now: 3000 });
    expect(s3.phase).toBe("finished");
    expect(commands).toContainEqual({ type: "STOP_TIMER" });
  });
});

describe("reduce - RESTART", () => {
  it("resets to ready phase with new words", () => {
    let state = makeState();
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "h", now: 1000 });
    const { state: s2, commands } = reduce(s1, { type: "RESTART", words: ["a", "b"] });
    expect(s2.phase).toBe("ready");
    expect(s2.words.words).toEqual(["a", "b"]);
    expect(commands).toContainEqual({ type: "STOP_TIMER" });
  });
});

describe("words mode completion", () => {
  it("finishes when last word is spaced past", () => {
    const twoWords = ["hi", "go"];
    let state = createInitialState({ ...DEFAULT_CONFIG, mode: "words", wordCount: 2, quickEnd: false }, twoWords);

    // Type "hi" + space
    let current = state;
    for (const char of "hi") {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char, now: 1000 });
      current = s;
    }
    const { state: afterFirstSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 1100 });
    expect(afterFirstSpace.phase).toBe("active");

    // Type "go" + space → should finish
    current = afterFirstSpace;
    for (const char of "go") {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char, now: 1200 });
      current = s;
    }
    const { state: final, commands } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 1300 });
    expect(final.phase).toBe("finished");
    expect(commands).toContainEqual({ type: "STOP_TIMER" });
  });

  it("finishes with quickEnd when last word matches exactly", () => {
    const twoWords = ["hi", "go"];
    let state = createInitialState(
      { ...DEFAULT_CONFIG, mode: "words", wordCount: 2, quickEnd: true },
      twoWords,
    );

    let current = state;
    for (const char of "hi") {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char, now: 1000 });
      current = s;
    }
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 1100 });

    // Type "go" exactly — quickEnd triggers
    current = afterSpace;
    for (const char of "go") {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char, now: 1200 });
      current = s;
    }
    expect(current.phase).toBe("finished");
  });
});
