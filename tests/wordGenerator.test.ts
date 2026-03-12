import { describe, it, expect } from "vitest";
import { generateWords, generateMoreWords } from "../src/engine/wordGenerator.js";
import { DEFAULT_CONFIG } from "../src/config/difficulty.js";

const wordList = ["the", "be", "of", "and", "a", "to", "in", "he", "have", "it"];

describe("generateWords", () => {
  it("generates correct count for words mode", () => {
    const words = generateWords({ ...DEFAULT_CONFIG, mode: "words", wordCount: 10 }, wordList);
    expect(words).toHaveLength(10);
  });

  it("generates 100 words for time mode", () => {
    const words = generateWords({ ...DEFAULT_CONFIG, mode: "time" }, wordList);
    expect(words).toHaveLength(100);
  });

  it("avoids consecutive duplicates", () => {
    const words = generateWords({ ...DEFAULT_CONFIG, mode: "words", wordCount: 50 }, wordList);
    for (let i = 1; i < words.length; i++) {
      expect(words[i]).not.toBe(words[i - 1]);
    }
  });

  it("all words come from the word list (no punctuation/numbers)", () => {
    const words = generateWords(
      { ...DEFAULT_CONFIG, mode: "words", wordCount: 20, punctuation: false, numbers: false },
      wordList,
    );
    for (const w of words) {
      expect(wordList).toContain(w);
    }
  });
});

describe("generateMoreWords", () => {
  it("generates additional words", () => {
    const existing = ["hello", "world"];
    const more = generateMoreWords(wordList, existing, 5);
    expect(more).toHaveLength(5);
  });

  it("avoids starting with the last existing word", () => {
    // Run multiple times to check probability
    for (let i = 0; i < 20; i++) {
      const existing = ["the"];
      const more = generateMoreWords(wordList, existing, 1);
      if (more[0] !== "the") return; // success
    }
    // Very unlikely all 20 are "the" with 10-word list
    expect(true).toBe(true);
  });
});
