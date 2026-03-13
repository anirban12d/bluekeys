import { describe, it, expect } from "vitest";
import { analyzeHistory } from "../src/engine/historyAnalysis.js";
import type { FinalResult } from "../src/engine/types.js";

function makeResult(overrides: Partial<FinalResult> = {}): FinalResult {
  return {
    wpm: 70,
    rawWpm: 75,
    accuracy: 95,
    charStats: {
      spaces: 10,
      correctWordChars: 50,
      allCorrectChars: 50,
      incorrectChars: 3,
      extraChars: 1,
      missedChars: 0,
      correctSpaces: 10,
    },
    testDuration: 30,
    consistency: 85,
    wpmHistory: [60, 70, 80],
    rawHistory: [65, 75, 85],
    burstHistory: [70, 80, 90],
    mode: "time",
    mode2: 30,
    language: "english",
    punctuation: false,
    numbers: false,
    difficulty: "normal",
    lazyMode: false,
    blindMode: false,
    funbox: ["none"],
    quoteInfo: null,
    timestamp: Date.now(),
    isPb: false,
    ...overrides,
  };
}

describe("analyzeHistory", () => {
  it("returns empty stats for no results", () => {
    const analysis = analyzeHistory([]);
    expect(analysis.stats.totalTests).toBe(0);
    expect(analysis.topMissedWords).toEqual([]);
    expect(analysis.topCharMistakes).toEqual([]);
    expect(analysis.practiceWords).toEqual([]);
  });

  it("computes overall stats correctly", () => {
    const results = [
      makeResult({ wpm: 60, accuracy: 90 }),
      makeResult({ wpm: 80, accuracy: 96 }),
    ];
    const analysis = analyzeHistory(results);
    expect(analysis.stats.totalTests).toBe(2);
    expect(analysis.stats.averageWpm).toBe(70);
    expect(analysis.stats.bestWpm).toBe(80);
  });

  it("aggregates missed words across results", () => {
    const results = [
      makeResult({ missedWords: { the: 3, would: 1 } }),
      makeResult({ missedWords: { the: 2, their: 1 } }),
    ];
    const analysis = analyzeHistory(results);
    expect(analysis.topMissedWords[0]!.word).toBe("the");
    expect(analysis.topMissedWords[0]!.count).toBe(5);
    expect(analysis.topMissedWords[1]!.word).toBe("would");
    expect(analysis.topMissedWords[1]!.count).toBe(1);
  });

  it("aggregates char mistakes across results", () => {
    const results = [
      makeResult({ charMistakes: { "h>e": 3, "e>r": 1 } }),
      makeResult({ charMistakes: { "h>e": 2, "i>o": 1 } }),
    ];
    const analysis = analyzeHistory(results);
    expect(analysis.topCharMistakes[0]!.expected).toBe("h");
    expect(analysis.topCharMistakes[0]!.typed).toBe("e");
    expect(analysis.topCharMistakes[0]!.count).toBe(5);
  });

  it("computes error trend sorted by timestamp", () => {
    const results = [
      makeResult({ accuracy: 90, timestamp: 1000 }),
      makeResult({ accuracy: 95, timestamp: 2000 }),
      makeResult({ accuracy: 92, timestamp: 500 }),
    ];
    const analysis = analyzeHistory(results);
    expect(analysis.errorTrend).toHaveLength(3);
    expect(analysis.errorTrend[0]!.timestamp).toBe(500);
    expect(analysis.errorTrend[2]!.timestamp).toBe(2000);
  });

  it("returns top 5 practice words", () => {
    const missedWords: Record<string, number> = {};
    for (let i = 0; i < 8; i++) {
      missedWords[`word${i}`] = 8 - i;
    }
    const results = [makeResult({ missedWords })];
    const analysis = analyzeHistory(results);
    expect(analysis.practiceWords).toHaveLength(5);
    expect(analysis.practiceWords[0]).toBe("word0");
  });

  it("handles results without missedWords (backward compat)", () => {
    const results = [makeResult({ missedWords: undefined })];
    const analysis = analyzeHistory(results);
    expect(analysis.topMissedWords).toEqual([]);
  });

  it("sets percentage relative to highest count", () => {
    const results = [
      makeResult({ missedWords: { the: 10, would: 5 } }),
    ];
    const analysis = analyzeHistory(results);
    expect(analysis.topMissedWords[0]!.percentage).toBe(100);
    expect(analysis.topMissedWords[1]!.percentage).toBe(50);
  });

  it("caps missed words at 15 entries", () => {
    const missedWords: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      missedWords[`word${i}`] = 20 - i;
    }
    const results = [makeResult({ missedWords })];
    const analysis = analyzeHistory(results);
    expect(analysis.topMissedWords).toHaveLength(15);
  });
});
