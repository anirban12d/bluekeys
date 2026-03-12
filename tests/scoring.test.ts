import { describe, it, expect } from "vitest";
import {
  countChars,
  calculateWpmAndRaw,
  calculateAccuracy,
  calculateBurst,
  calculateConsistency,
} from "../src/engine/scoring.js";

describe("countChars", () => {
  it("counts all correct chars for a perfect word", () => {
    const result = countChars(["hello"], "", ["hello", "world"], 1, false, false);
    expect(result.correctWordChars).toBe(5);
    expect(result.incorrectChars).toBe(0);
    expect(result.extraChars).toBe(0);
    expect(result.missedChars).toBe(0);
  });

  it("counts incorrect chars", () => {
    const result = countChars(["hxllo"], "", ["hello", "world"], 1, false, false);
    expect(result.incorrectChars).toBe(1);
    expect(result.allCorrectChars).toBe(4);
    // Word is not fully correct so correctWordChars = 0
    expect(result.correctWordChars).toBe(0);
  });

  it("counts extra chars", () => {
    const result = countChars(["helloo"], "", ["hello", "world"], 1, false, false);
    expect(result.extraChars).toBe(1);
  });

  it("counts missed chars for incomplete words", () => {
    const result = countChars(["hel"], "", ["hello", "world"], 1, false, false);
    expect(result.missedChars).toBe(2);
  });

  it("handles final word in time mode (partial credit)", () => {
    // Active word index = 1, input is partial "wor" for target "world"
    const result = countChars(["hello"], "wor", ["hello", "world"], 1, true, true);
    // Time mode final word: no missed chars for untyped portion
    expect(result.missedChars).toBe(0);
  });

  it("counts spaces correctly", () => {
    // activeWordIndex=2, isFinal=false => lastIndex=1, so we count words 0 and 1
    const result = countChars(["hello", "world"], "", ["hello", "world", "foo"], 2, false, false);
    // spaces counted for word indices 1 (one space between word 0 and word 1)
    expect(result.spaces).toBe(1);
    expect(result.correctSpaces).toBe(1);
  });

  it("handles empty input", () => {
    const result = countChars([], "", ["hello"], 0, true, false);
    expect(result.correctWordChars).toBe(0);
    expect(result.missedChars).toBe(5);
  });
});

describe("calculateWpmAndRaw", () => {
  it("calculates WPM from char counts", () => {
    const charCount = {
      spaces: 2,
      correctWordChars: 10,
      allCorrectChars: 10,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      correctSpaces: 2,
    };
    const { wpm, raw } = calculateWpmAndRaw(charCount, 60);
    // wpm = (10 + 2) * 1 / 5 = 2.4
    expect(wpm).toBeCloseTo(2.4);
    // raw = (10 + 2 + 0 + 0) * 1 / 5 = 2.4
    expect(raw).toBeCloseTo(2.4);
  });

  it("returns 0 for 0 seconds", () => {
    const { wpm, raw } = calculateWpmAndRaw(
      { spaces: 0, correctWordChars: 10, allCorrectChars: 10, incorrectChars: 0, extraChars: 0, missedChars: 0, correctSpaces: 0 },
      0,
    );
    expect(wpm).toBe(0);
    expect(raw).toBe(0);
  });

  it("scales WPM with shorter time", () => {
    const charCount = {
      spaces: 1,
      correctWordChars: 5,
      allCorrectChars: 5,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      correctSpaces: 1,
    };
    const { wpm } = calculateWpmAndRaw(charCount, 30);
    // wpm = (5 + 1) * (60/30) / 5 = 6 * 2 / 5 = 2.4
    expect(wpm).toBeCloseTo(2.4);
  });
});

describe("calculateAccuracy", () => {
  it("returns 100 for all correct", () => {
    expect(calculateAccuracy(10, 0)).toBe(100);
  });

  it("returns 50 for equal correct/incorrect", () => {
    expect(calculateAccuracy(5, 5)).toBe(50);
  });

  it("returns 100 for no keypresses", () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });
});

describe("calculateBurst", () => {
  it("calculates burst WPM", () => {
    // 5 chars in 1 second = 5 * 60 / 1 / 5 = 60 wpm
    expect(calculateBurst(5, 1000)).toBe(60);
  });

  it("returns 0 for 0 time", () => {
    expect(calculateBurst(5, 0)).toBe(0);
  });
});

describe("calculateConsistency", () => {
  it("returns 100 for identical values", () => {
    expect(calculateConsistency([60, 60, 60, 60])).toBe(100);
  });

  it("returns lower value for varied input", () => {
    const result = calculateConsistency([30, 60, 90, 120]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });

  it("returns 100 for too few data points", () => {
    expect(calculateConsistency([60])).toBe(100);
    expect(calculateConsistency([])).toBe(100);
  });
});
