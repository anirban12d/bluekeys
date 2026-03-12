import { describe, it, expect } from "vitest";
import {
  countChars,
  calculateWpmAndRaw,
  calculateConsistency,
  convertSpeed,
  calculateFinalResult,
} from "../src/engine/scoring.js";
import { createInitialState, reduce } from "../src/engine/gameEngine.js";
import { DEFAULT_CONFIG } from "../src/config/difficulty.js";

describe("countChars - advanced", () => {
  it("handles multiple words with mixed correctness", () => {
    const result = countChars(
      ["hello", "wxrld"],  // first correct, second has errors
      "",
      ["hello", "world", "test"],
      2,
      false,
      false,
    );
    expect(result.correctWordChars).toBe(5); // only "hello" is fully correct
    expect(result.allCorrectChars).toBe(5 + 4); // h,e,l,l,o + w,r,l,d (not x)
    expect(result.incorrectChars).toBe(1); // 'x' in "wxrld"
    expect(result.spaces).toBe(1);
  });

  it("counts extra chars across multiple words", () => {
    const result = countChars(
      ["helloo", "worlddd"],
      "",
      ["hello", "world", "test"],
      2,
      false,
      false,
    );
    expect(result.extraChars).toBe(1 + 2); // 1 extra in "helloo", 2 extra in "worlddd"
  });

  it("handles final word with no input (missed entire word)", () => {
    const result = countChars([], "", ["hello"], 0, true, false);
    expect(result.missedChars).toBe(5);
    expect(result.correctWordChars).toBe(0);
  });

  it("handles current input for active word (non-final)", () => {
    // activeWordIndex=0, isFinal=false => lastIndex = -1, so no words counted
    const result = countChars([], "hel", ["hello"], 0, false, false);
    expect(result.correctWordChars).toBe(0);
    expect(result.allCorrectChars).toBe(0);
  });

  it("handles current input for active word (final)", () => {
    // activeWordIndex=0, isFinal=true => lastIndex = 0, counts word 0 using currentInput
    const result = countChars([], "hel", ["hello"], 0, true, false);
    expect(result.allCorrectChars).toBe(3);
    expect(result.missedChars).toBe(2);
  });

  it("time mode final word does not count missed chars for untyped portion", () => {
    const result = countChars(["hello"], "wo", ["hello", "world"], 1, true, true);
    // "hello" fully correct, "wo" partial for "world" in time mode
    expect(result.correctWordChars).toBe(5); // "hello"
    expect(result.allCorrectChars).toBe(5 + 2); // "hello" + "wo"
    expect(result.missedChars).toBe(0); // time mode final word: no missed
  });

  it("non-time mode final word counts missed chars", () => {
    const result = countChars(["hello"], "wo", ["hello", "world"], 1, true, false);
    expect(result.missedChars).toBe(3); // "rld" missed
  });

  it("tracks correct spaces only for completed words", () => {
    // 3 words in history, at word 3
    const result = countChars(
      ["hello", "world", "test"],
      "",
      ["hello", "world", "test", "next"],
      3,
      false,
      false,
    );
    // Spaces at index 1, 2 → 2 spaces total
    expect(result.spaces).toBe(2);
    expect(result.correctSpaces).toBe(2);
  });
});

describe("calculateWpmAndRaw - advanced", () => {
  it("includes incorrect and extra chars in raw but not wpm", () => {
    const charCount = {
      spaces: 1,
      correctWordChars: 0, // no fully correct words
      allCorrectChars: 3,
      incorrectChars: 2,
      extraChars: 1,
      missedChars: 0,
      correctSpaces: 1,
    };
    const { wpm, raw } = calculateWpmAndRaw(charCount, 60);
    // wpm = (0 + 1) / 5 = 0.2
    expect(wpm).toBeCloseTo(0.2);
    // raw = (3 + 1 + 2 + 1) / 5 = 1.4
    expect(raw).toBeCloseTo(1.4);
  });

  it("never returns negative values", () => {
    const charCount = {
      spaces: 0,
      correctWordChars: 0,
      allCorrectChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      correctSpaces: 0,
    };
    const { wpm, raw } = calculateWpmAndRaw(charCount, 60);
    expect(wpm).toBeGreaterThanOrEqual(0);
    expect(raw).toBeGreaterThanOrEqual(0);
  });

  it("handles negative testSeconds by returning 0", () => {
    const charCount = {
      spaces: 1,
      correctWordChars: 10,
      allCorrectChars: 10,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      correctSpaces: 1,
    };
    const { wpm, raw } = calculateWpmAndRaw(charCount, -1);
    expect(wpm).toBe(0);
    expect(raw).toBe(0);
  });
});

describe("calculateConsistency - advanced", () => {
  it("returns 100 when all values are zero (filtered out)", () => {
    expect(calculateConsistency([0, 0, 0])).toBe(100);
  });

  it("filters zero values before computing", () => {
    // Only non-zero values are [60, 60], identical → 100
    expect(calculateConsistency([0, 60, 0, 60, 0])).toBe(100);
  });

  it("returns 100 when only one non-zero value", () => {
    expect(calculateConsistency([0, 50, 0])).toBe(100);
  });

  it("clamps to 0 minimum for extreme variance", () => {
    // Very high variance: cv > 1 → consistency < 0, clamped to 0
    const result = calculateConsistency([1, 1000]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("clamps to 100 maximum", () => {
    const result = calculateConsistency([100, 100, 100]);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe("convertSpeed", () => {
  it("wpm returns identity", () => {
    expect(convertSpeed(120, "wpm")).toBe(120);
  });

  it("cpm = wpm * 5", () => {
    expect(convertSpeed(120, "cpm")).toBe(600);
  });

  it("wps = wpm / 60", () => {
    expect(convertSpeed(120, "wps")).toBe(2);
  });

  it("cps = wpm * 5 / 60", () => {
    expect(convertSpeed(120, "cps")).toBe(10);
  });

  it("wph = wpm * 60", () => {
    expect(convertSpeed(120, "wph")).toBe(7200);
  });

  it("returns wpm for unknown unit", () => {
    // @ts-expect-error testing default case
    expect(convertSpeed(120, "unknown")).toBe(120);
  });
});

describe("calculateFinalResult", () => {
  it("computes final result from game state", () => {
    const state = createInitialState(DEFAULT_CONFIG, ["hello", "world"]);
    // Simulate some typing
    let current = state;
    for (const char of "hello") {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char, now: 1000 });
      current = s;
    }
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 1500 });
    // Tick a couple times
    const { state: afterTick } = reduce(afterSpace, { type: "TICK", now: 2000 });
    const { state: afterTick2 } = reduce(afterTick, { type: "TICK", now: 3000 });

    const result = calculateFinalResult(afterTick2);
    expect(result.mode).toBe("time");
    expect(result.language).toBe("english");
    expect(result.wpm).toBeGreaterThanOrEqual(0);
    expect(result.rawWpm).toBeGreaterThanOrEqual(0);
    expect(result.accuracy).toBeGreaterThanOrEqual(0);
    expect(result.accuracy).toBeLessThanOrEqual(100);
    expect(result.consistency).toBeGreaterThanOrEqual(0);
    expect(result.consistency).toBeLessThanOrEqual(100);
    expect(result.testDuration).toBeGreaterThan(0);
    expect(result.isPb).toBe(false);
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.charStats).toBeDefined();
    expect(result.punctuation).toBe(false);
    expect(result.numbers).toBe(false);
    expect(result.difficulty).toBe("normal");
  });

  it("uses elapsed seconds or 1 as minimum", () => {
    // State with 0 elapsed
    const state = createInitialState(DEFAULT_CONFIG, ["hello"]);
    const result = calculateFinalResult(state);
    expect(result.testDuration).toBe(1); // fallback to 1
  });

  it("includes correct mode2 for words mode", () => {
    const state = createInitialState(
      { ...DEFAULT_CONFIG, mode: "words", wordCount: 25 },
      ["hello"],
    );
    const result = calculateFinalResult(state);
    expect(result.mode2).toBe(25);
  });

  it("includes correct mode2 for quote mode", () => {
    const state = createInitialState(
      { ...DEFAULT_CONFIG, mode: "quote" },
      ["hello"],
      { source: "test", id: 42 },
    );
    const result = calculateFinalResult(state);
    expect(result.mode2).toBe(42);
  });

  it("includes correct mode2 for zen mode", () => {
    const state = createInitialState(
      { ...DEFAULT_CONFIG, mode: "zen" },
      [""],
    );
    const result = calculateFinalResult(state);
    expect(result.mode2).toBe(0);
  });

  it("includes correct mode2 for custom mode", () => {
    const state = createInitialState(
      { ...DEFAULT_CONFIG, mode: "custom" },
      ["hello"],
    );
    const result = calculateFinalResult(state);
    expect(result.mode2).toBe("custom");
  });
});
