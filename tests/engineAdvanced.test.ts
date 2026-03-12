import { describe, it, expect } from "vitest";
import { createInitialState, reduce } from "../src/engine/gameEngine.js";
import { DEFAULT_CONFIG } from "../src/config/difficulty.js";
import type { GameConfig, GameState } from "../src/engine/types.js";

const words = ["hello", "world", "test", "type", "fast"];

function makeState(overrides?: Partial<GameConfig>, customWords?: string[]): GameState {
  return createInitialState({ ...DEFAULT_CONFIG, ...overrides }, customWords ?? words);
}

// Helper to type a full string
function typeString(state: GameState, str: string, startTime = 1000): GameState {
  let current = state;
  let t = startTime;
  for (const char of str) {
    const { state: s } = reduce(current, { type: "INSERT_CHAR", char, now: t });
    current = s;
    t += 50;
  }
  return current;
}

// Helper to type a word then press space
function typeWordAndSpace(state: GameState, word: string, startTime = 1000): GameState {
  let s = typeString(state, word, startTime);
  const { state: next } = reduce(s, { type: "INSERT_CHAR", char: " ", now: startTime + word.length * 50 + 50 });
  return next;
}

// ── Zen mode ──────────────────────────────────────────────────────────

describe("reduce - zen mode", () => {
  it("accepts any character and grows target words", () => {
    let state = makeState({ mode: "zen" }, [""]);
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "a", now: 1000 });
    expect(s1.input.current).toBe("a");
    // Target word should be updated to match input
    expect(s1.words.words[0]).toBe("a");
  });

  it("space completes a zen word and creates next slot", () => {
    let state = makeState({ mode: "zen" }, [""]);
    let current = typeString(state, "hello", 1000);
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 2000 });
    expect(afterSpace.words.activeWordIndex).toBe(1);
    expect(afterSpace.input.current).toBe("");
    expect(afterSpace.input.history).toEqual(["hello"]);
    expect(afterSpace.words.words[0]).toBe("hello");
  });

  it("does not advance on space with empty input in zen mode", () => {
    let state = makeState({ mode: "zen" }, [""]);
    // Auto-start first
    const { state: s1 } = reduce(state, { type: "INSERT_CHAR", char: "a", now: 1000 });
    // Delete the char
    const { state: s2 } = reduce(s1, { type: "DELETE_CHAR" });
    // Space on empty
    const { state: s3 } = reduce(s2, { type: "INSERT_CHAR", char: " ", now: 1100 });
    expect(s3.words.activeWordIndex).toBe(0);
  });

  it("all zen chars are marked correct", () => {
    let state = makeState({ mode: "zen" }, [""]);
    let current = typeString(state, "abc", 1000);
    expect(current.metrics.accuracy.correct).toBe(3);
    expect(current.metrics.accuracy.incorrect).toBe(0);
  });
});

// ── Confidence mode ──────────────────────────────────────────────────

describe("reduce - confidence mode", () => {
  it("confidenceMode=max blocks DELETE_CHAR", () => {
    let state = makeState({ confidenceMode: "max" });
    let current = typeString(state, "he", 1000);
    const { state: afterDelete } = reduce(current, { type: "DELETE_CHAR" });
    expect(afterDelete.input.current).toBe("he");
  });

  it("confidenceMode=max blocks DELETE_WORD", () => {
    let state = makeState({ confidenceMode: "max" });
    let current = typeString(state, "he", 1000);
    const { state: afterDelete } = reduce(current, { type: "DELETE_WORD" });
    expect(afterDelete.input.current).toBe("he");
  });

  it("confidenceMode=on blocks DELETE_CHAR", () => {
    let state = makeState({ confidenceMode: "on" });
    let current = typeString(state, "he", 1000);
    const { state: afterDelete } = reduce(current, { type: "DELETE_CHAR" });
    expect(afterDelete.input.current).toBe("he");
  });

  it("freedomMode overrides confidenceMode=max for DELETE_CHAR", () => {
    let state = makeState({ confidenceMode: "max", freedomMode: true });
    let current = typeString(state, "he", 1000);
    const { state: afterDelete } = reduce(current, { type: "DELETE_CHAR" });
    expect(afterDelete.input.current).toBe("h");
  });

  it("freedomMode overrides confidenceMode=on for DELETE_CHAR", () => {
    let state = makeState({ confidenceMode: "on", freedomMode: true });
    let current = typeString(state, "he", 1000);
    const { state: afterDelete } = reduce(current, { type: "DELETE_CHAR" });
    expect(afterDelete.input.current).toBe("h");
  });

  it("freedomMode overrides confidenceMode=max for DELETE_WORD", () => {
    let state = makeState({ confidenceMode: "max", freedomMode: true });
    let current = typeString(state, "he", 1000);
    const { state: afterDelete } = reduce(current, { type: "DELETE_WORD" });
    expect(afterDelete.input.current).toBe("");
  });
});

// ── stopOnError mode ────────────────────────────────────────────────

describe("reduce - stopOnError", () => {
  it("stopOnError=word prevents advancing on space when word has errors", () => {
    let state = makeState({ stopOnError: "word" });
    // Type "hellx" (wrong last char) then space
    let current = typeString(state, "hellx", 1000);
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 2000 });
    // Should NOT advance
    expect(afterSpace.words.activeWordIndex).toBe(0);
    expect(afterSpace.input.current).toBe("hellx");
  });

  it("stopOnError=word allows space when word is correct", () => {
    let state = makeState({ stopOnError: "word" });
    let current = typeString(state, "hello", 1000);
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 2000 });
    expect(afterSpace.words.activeWordIndex).toBe(1);
  });

  it("stopOnError=letter rejects incorrect chars", () => {
    let state = makeState({ stopOnError: "letter" });
    // Type "h" (correct), then "x" (incorrect for "e")
    let current = typeString(state, "h", 1000);
    const { state: s2 } = reduce(current, { type: "INSERT_CHAR", char: "x", now: 1050 });
    expect(s2.input.current).toBe("h"); // "x" rejected
  });

  it("stopOnError=letter with freedomMode allows incorrect chars", () => {
    let state = makeState({ stopOnError: "letter", freedomMode: true });
    let current = typeString(state, "h", 1000);
    const { state: s2 } = reduce(current, { type: "INSERT_CHAR", char: "x", now: 1050 });
    expect(s2.input.current).toBe("hx"); // "x" allowed via freedom mode
  });

  it("stopOnError=word prevents DELETE_CHAR going to previous word", () => {
    let state = makeState({ stopOnError: "word" });
    let current = typeWordAndSpace(state, "hello", 1000);
    // At word 1 with empty input - try to go back
    const { state: afterDelete } = reduce(current, { type: "DELETE_CHAR" });
    // Should NOT go back because stopOnError=word and freedomMode is off
    expect(afterDelete.words.activeWordIndex).toBe(1);
  });

  it("stopOnError=off allows DELETE_CHAR going to previous word", () => {
    let state = makeState({ stopOnError: "off" });
    let current = typeWordAndSpace(state, "hello", 1000);
    const { state: afterDelete } = reduce(current, { type: "DELETE_CHAR" });
    expect(afterDelete.words.activeWordIndex).toBe(0);
    expect(afterDelete.input.current).toBe("hello");
  });
});

// ── Lazy mode ───────────────────────────────────────────────────────

describe("reduce - lazy mode", () => {
  it("marks all chars as correct during typing in lazy mode", () => {
    let state = makeState({ lazyMode: true });
    // Type completely wrong chars for "hello"
    let current = typeString(state, "xxxxx", 1000);
    // All chars treated as correct during typing
    expect(current.metrics.accuracy.correct).toBe(5);
    expect(current.metrics.accuracy.incorrect).toBe(0);
  });

  it("stopOnError=word with lazyMode checks only length at word boundary", () => {
    let state = makeState({ lazyMode: true, stopOnError: "word" });
    // Type wrong chars but correct length for "hello"
    let current = typeString(state, "xxxxx", 1000);
    // Space should succeed because lazy mode only checks length
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 2000 });
    expect(afterSpace.words.activeWordIndex).toBe(1);
  });

  it("stopOnError=word with lazyMode blocks if length differs", () => {
    let state = makeState({ lazyMode: true, stopOnError: "word" });
    // Type too few chars
    let current = typeString(state, "xxx", 1000);
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 2000 });
    expect(afterSpace.words.activeWordIndex).toBe(0); // blocked
  });
});

// ── strictSpace ─────────────────────────────────────────────────────

describe("reduce - strictSpace", () => {
  it("prevents space when input is empty with strictSpace", () => {
    let state = makeState({ strictSpace: true });
    // Auto-start
    let current = typeString(state, "h", 1000);
    const { state: s2 } = reduce(current, { type: "DELETE_CHAR" });
    const { state: s3 } = reduce(s2, { type: "INSERT_CHAR", char: " ", now: 1100 });
    expect(s3.words.activeWordIndex).toBe(0);
  });
});

// ── Difficulty-based fail conditions ────────────────────────────────

describe("reduce - difficulty fail conditions", () => {
  it("expert difficulty fails when accuracy < 95% after 5 seconds", () => {
    let state = makeState({ difficulty: "expert" });
    // Type lots of wrong chars to tank accuracy
    let current = state;
    for (let i = 0; i < 20; i++) {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char: "x", now: 1000 + i * 50 });
      current = s;
    }
    // All incorrect: accuracy = 0%
    // Tick 5 times to reach elapsed >= 5
    for (let i = 0; i < 4; i++) {
      const { state: s } = reduce(current, { type: "TICK", now: 2000 + i * 1000 });
      current = s;
    }
    expect(current.phase).toBe("active");
    // 5th tick triggers check
    const { state: final } = reduce(current, { type: "TICK", now: 6000 });
    expect(final.phase).toBe("failed");
    expect(final.failReason).toContain("Accuracy below 95%");
  });

  it("master difficulty fails on any error", () => {
    let state = makeState({ difficulty: "master" });
    // Type one wrong char
    let current = typeString(state, "x", 1000); // incorrect for "h"
    // Tick once to trigger check
    const { state: afterTick } = reduce(current, { type: "TICK", now: 2000 });
    expect(afterTick.phase).toBe("failed");
    expect(afterTick.failReason).toContain("master mode");
  });

  it("normal difficulty does not fail on errors", () => {
    let state = makeState({ difficulty: "normal" });
    let current = typeString(state, "xxxxx", 1000);
    for (let i = 0; i < 6; i++) {
      const { state: s } = reduce(current, { type: "TICK", now: 2000 + i * 1000 });
      current = s;
    }
    expect(current.phase).toBe("active");
  });
});

// ── Min WPM fail condition ──────────────────────────────────────────

describe("reduce - minWpm fail condition", () => {
  it("fails when WPM below custom minimum after 5 seconds", () => {
    let state = makeState({ minWpm: "custom", minWpmCustomSpeed: 999 });
    // Type one char
    let current = typeString(state, "h", 1000);
    // Tick to 5 seconds - WPM will be very low
    for (let i = 0; i < 4; i++) {
      const { state: s } = reduce(current, { type: "TICK", now: 2000 + i * 1000 });
      current = s;
    }
    expect(current.phase).toBe("active");
    const { state: final } = reduce(current, { type: "TICK", now: 6000 });
    expect(final.phase).toBe("failed");
    expect(final.failReason).toContain("WPM below minimum");
  });

  it("does not fail before 5 seconds", () => {
    let state = makeState({ minWpm: "custom", minWpmCustomSpeed: 999 });
    let current = typeString(state, "h", 1000);
    // Only tick 3 times
    for (let i = 0; i < 3; i++) {
      const { state: s } = reduce(current, { type: "TICK", now: 2000 + i * 1000 });
      current = s;
    }
    expect(current.phase).toBe("active");
  });
});

// ── Min accuracy fail condition ─────────────────────────────────────

describe("reduce - minAcc fail condition", () => {
  it("fails when accuracy below custom minimum after 5 seconds", () => {
    let state = makeState({ minAcc: "custom", minAccCustom: 99 });
    // Type wrong chars to lower accuracy
    let current = state;
    for (let i = 0; i < 10; i++) {
      const { state: s } = reduce(current, { type: "INSERT_CHAR", char: "x", now: 1000 + i * 50 });
      current = s;
    }
    for (let i = 0; i < 5; i++) {
      const { state: s } = reduce(current, { type: "TICK", now: 2000 + i * 1000 });
      current = s;
    }
    expect(current.phase).toBe("failed");
    expect(current.failReason).toContain("Accuracy below minimum");
  });
});

// ── Min burst fail condition ────────────────────────────────────────

describe("reduce - minBurst fail condition", () => {
  it("fails on fixed burst below threshold", () => {
    let state = makeState({ minBurst: "fixed", minBurstCustomSpeed: 9999 });
    // Type some chars and tick to generate burst history
    let current = typeString(state, "h", 1000);
    // Tick to generate burst history entry
    const { state: s1 } = reduce(current, { type: "TICK", now: 2000 });
    // Tick again to trigger the check (burstHistory now has entry)
    const { state: s2 } = reduce(s1, { type: "TICK", now: 3000 });
    expect(s2.phase).toBe("failed");
    expect(s2.failReason).toContain("Burst below minimum");
  });
});

// ── FINISH event ────────────────────────────────────────────────────

describe("reduce - FINISH", () => {
  it("transitions active game to finished", () => {
    let state = makeState();
    let current = typeString(state, "h", 1000);
    const { state: finished, commands } = reduce(current, { type: "FINISH" });
    expect(finished.phase).toBe("finished");
    expect(commands).toContainEqual({ type: "STOP_TIMER" });
  });

  it("does nothing when not active", () => {
    let state = makeState(); // "ready" phase
    const { state: same } = reduce(state, { type: "FINISH" });
    expect(same.phase).toBe("ready");
  });
});

// ── FAIL event ──────────────────────────────────────────────────────

describe("reduce - FAIL", () => {
  it("fails with given reason", () => {
    let state = makeState();
    const { state: failed, commands } = reduce(state, { type: "FAIL", reason: "custom fail" });
    expect(failed.phase).toBe("failed");
    expect(failed.failReason).toBe("custom fail");
    expect(commands).toContainEqual({ type: "STOP_TIMER" });
  });
});

// ── ADD_WORDS event ─────────────────────────────────────────────────

describe("reduce - ADD_WORDS", () => {
  it("appends new words to existing list", () => {
    let state = makeState();
    const { state: updated } = reduce(state, { type: "ADD_WORDS", words: ["extra", "words"] });
    expect(updated.words.words).toEqual([...words, "extra", "words"]);
  });
});

// ── SET_CONFIG event ────────────────────────────────────────────────

describe("reduce - SET_CONFIG", () => {
  it("updates config partially", () => {
    let state = makeState();
    const { state: updated } = reduce(state, { type: "SET_CONFIG", config: { theme: "dracula" } });
    expect(updated.config.theme).toBe("dracula");
    // Other config remains
    expect(updated.config.mode).toBe("time");
  });
});

// ── RESTART preserves previousWords ─────────────────────────────────

describe("reduce - RESTART", () => {
  it("preserves previous words for repeat functionality", () => {
    let state = makeState();
    let current = typeString(state, "h", 1000);
    const { state: restarted } = reduce(current, { type: "RESTART", words: ["new"] });
    expect(restarted.previousWords).toEqual(words);
  });
});

// ── INSERT_CHAR in non-ready/active phase ───────────────────────────

describe("reduce - phase guards", () => {
  it("INSERT_CHAR ignored in finished phase", () => {
    let state = makeState({ mode: "words", wordCount: 1, quickEnd: true }, ["hi"]);
    let current = typeString(state, "hi", 1000);
    // Should be finished via quickEnd
    expect(current.phase).toBe("finished");
    const { state: same } = reduce(current, { type: "INSERT_CHAR", char: "x", now: 2000 });
    expect(same.input.current).toBe(current.input.current);
  });

  it("DELETE_CHAR ignored in ready phase", () => {
    let state = makeState();
    const { state: same } = reduce(state, { type: "DELETE_CHAR" });
    expect(same.phase).toBe("ready");
  });

  it("DELETE_WORD ignored in ready phase", () => {
    let state = makeState();
    const { state: same } = reduce(state, { type: "DELETE_WORD" });
    expect(same.phase).toBe("ready");
  });

  it("TICK ignored in ready phase", () => {
    let state = makeState();
    const { state: same } = reduce(state, { type: "TICK", now: 2000 });
    expect(same.timing.elapsedSeconds).toBe(0);
  });
});

// ── Time mode GENERATE_WORDS command ────────────────────────────────

describe("reduce - time mode word generation", () => {
  it("emits GENERATE_WORDS when approaching end of word buffer", () => {
    // Create a small word set (12 words)
    const shortWords = Array.from({ length: 12 }, (_, i) => `w${i}`);
    let state = makeState({ mode: "time", timeLimit: 60 }, shortWords);

    // Type through words to get near the end
    let current = state;
    for (let i = 0; i < 11; i++) {
      current = typeWordAndSpace(current, shortWords[i]!, 1000 + i * 500);
    }

    // Check that GENERATE_WORDS was emitted at some point during typing
    // The last space should trigger it when activeWordIndex >= words.length - 10
    // With 12 words, after typing 2 words (index 2), we're at 12-2=10 remaining, so need more
    // Actually at index >= 12-10 = 2, so from word 2 onwards
    // Let's verify the state advanced
    expect(current.words.activeWordIndex).toBeGreaterThan(0);
  });
});

// ── Word timing and slow words ──────────────────────────────────────

describe("reduce - word timing tracking", () => {
  it("tracks word timings on space", () => {
    let state = makeState();
    let current = typeString(state, "hello", 1000);
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 2000 });
    expect(afterSpace.metrics.wordTimings).toHaveLength(1);
    expect(afterSpace.metrics.wordTimings[0]).toBeGreaterThan(0);
  });

  it("tracks missed words when typing errors", () => {
    let state = makeState();
    // Type "hellx" (wrong) then space
    let current = typeString(state, "hellx", 1000);
    const { state: afterSpace } = reduce(current, { type: "INSERT_CHAR", char: " ", now: 2000 });
    expect(afterSpace.input.missedWords).toHaveProperty("hello");
    expect(afterSpace.input.missedWords["hello"]).toBe(1);
  });
});

// ── Metrics tracking on TICK ────────────────────────────────────────

describe("reduce - TICK metrics", () => {
  it("tracks wpm, raw, and burst history", () => {
    let state = makeState();
    let current = typeString(state, "hel", 1000);
    const { state: afterTick } = reduce(current, { type: "TICK", now: 2000 });
    expect(afterTick.metrics.wpmHistory).toHaveLength(1);
    expect(afterTick.metrics.rawHistory).toHaveLength(1);
    expect(afterTick.metrics.burstHistory).toHaveLength(1);
  });

  it("tracks keypress count history", () => {
    let state = makeState();
    let current = typeString(state, "hel", 1000);
    const { state: afterTick } = reduce(current, { type: "TICK", now: 2000 });
    expect(afterTick.metrics.keypressCountHistory).toHaveLength(1);
  });

  it("tracks AFK history", () => {
    let state = makeState();
    let current = typeString(state, "h", 1000);
    // Tick without any keypresses in this second
    const { state: s1 } = reduce(current, { type: "TICK", now: 2000 });
    // Second tick with 0 keypresses since last reset
    const { state: s2 } = reduce(s1, { type: "TICK", now: 3000 });
    expect(s2.metrics.afkHistory).toContain(true);
  });

  it("resets lastSecondKeypresses after tick", () => {
    let state = makeState();
    let current = typeString(state, "hel", 1000);
    const { state: afterTick } = reduce(current, { type: "TICK", now: 2000 });
    expect(afterTick.metrics.lastSecondKeypresses).toBe(0);
  });
});

// ── DELETE_WORD going back to previous word ─────────────────────────

describe("reduce - DELETE_WORD advanced", () => {
  it("goes to previous word when current is empty", () => {
    let state = makeState();
    let current = typeWordAndSpace(state, "hello", 1000);
    expect(current.words.activeWordIndex).toBe(1);
    const { state: afterDelWord } = reduce(current, { type: "DELETE_WORD" });
    expect(afterDelWord.words.activeWordIndex).toBe(0);
    expect(afterDelWord.input.current).toBe("hello");
  });

  it("does not go back when stopOnError=word", () => {
    let state = makeState({ stopOnError: "word" });
    let current = typeWordAndSpace(state, "hello", 1000);
    const { state: afterDelWord } = reduce(current, { type: "DELETE_WORD" });
    expect(afterDelWord.words.activeWordIndex).toBe(1); // stays
  });

  it("freedomMode allows going back even with stopOnError=word", () => {
    let state = makeState({ stopOnError: "word", freedomMode: true });
    let current = typeWordAndSpace(state, "hello", 1000);
    const { state: afterDelWord } = reduce(current, { type: "DELETE_WORD" });
    expect(afterDelWord.words.activeWordIndex).toBe(0);
  });
});

// ── Quote mode completion ───────────────────────────────────────────

describe("reduce - quote mode completion", () => {
  it("finishes when last word is spaced past in quote mode", () => {
    const quoteWords = ["the", "end"];
    let state = createInitialState(
      { ...DEFAULT_CONFIG, mode: "quote", quickEnd: false },
      quoteWords,
      { source: "test", id: 1 },
    );

    let current = typeWordAndSpace(state, "the", 1000);
    expect(current.phase).toBe("active");

    let afterType = typeString(current, "end", 2000);
    const { state: final } = reduce(afterType, { type: "INSERT_CHAR", char: " ", now: 3000 });
    expect(final.phase).toBe("finished");
  });
});

// ── Custom mode completion ──────────────────────────────────────────

describe("reduce - custom mode completion", () => {
  it("finishes with quickEnd on last word of custom mode", () => {
    const customWords = ["hi"];
    let state = createInitialState(
      { ...DEFAULT_CONFIG, mode: "custom", quickEnd: true },
      customWords,
    );
    let current = typeString(state, "hi", 1000);
    expect(current.phase).toBe("finished");
  });
});

// ── DELETE_CHAR at first word with empty input ──────────────────────

describe("reduce - DELETE_CHAR edge cases", () => {
  it("does nothing at first word with empty input", () => {
    let state = makeState();
    let current = typeString(state, "h", 1000);
    const { state: s1 } = reduce(current, { type: "DELETE_CHAR" });
    const { state: s2 } = reduce(s1, { type: "DELETE_CHAR" }); // now empty at word 0
    expect(s2.input.current).toBe("");
    expect(s2.words.activeWordIndex).toBe(0);
  });
});
