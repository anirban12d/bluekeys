import { describe, it, expect } from "vitest";
import {
  generateWords,
  generateMoreWords,
  generateQuoteWords,
  generateCustomWords,
  generateZenWords,
} from "../src/engine/wordGenerator.js";
import { DEFAULT_CONFIG } from "../src/config/difficulty.js";
import type { GameConfig } from "../src/engine/types.js";

const wordList = ["the", "be", "of", "and", "a", "to", "in", "he", "have", "it"];

describe("generateQuoteWords", () => {
  it("splits quote text into words", () => {
    expect(generateQuoteWords("hello world")).toEqual(["hello", "world"]);
  });

  it("handles multiple spaces", () => {
    expect(generateQuoteWords("hello   world")).toEqual(["hello", "world"]);
  });

  it("handles leading/trailing spaces", () => {
    expect(generateQuoteWords("  hello world  ")).toEqual(["hello", "world"]);
  });

  it("returns empty array for empty string", () => {
    expect(generateQuoteWords("")).toEqual([]);
  });

  it("handles single word", () => {
    expect(generateQuoteWords("hello")).toEqual(["hello"]);
  });
});

describe("generateZenWords", () => {
  it("returns array with one empty string", () => {
    expect(generateZenWords()).toEqual([""]);
  });
});

describe("generateCustomWords", () => {
  it("returns fallback when no custom text configured", () => {
    const config = { ...DEFAULT_CONFIG, customText: null } as GameConfig;
    const words = generateCustomWords(config);
    expect(words).toEqual(["no", "custom", "text", "configured"]);
  });

  it("returns fallback for empty text array", () => {
    const config = {
      ...DEFAULT_CONFIG,
      customText: {
        text: [],
        mode: "repeat" as const,
        pipeDelimiter: false,
        limit: { mode: "word" as const, value: 0 },
      },
    } as GameConfig;
    const words = generateCustomWords(config);
    expect(words).toEqual(["no", "custom", "text", "configured"]);
  });

  it("generates words with word limit", () => {
    const config = {
      ...DEFAULT_CONFIG,
      customText: {
        text: ["hello", "world"],
        mode: "repeat" as const,
        pipeDelimiter: false,
        limit: { mode: "word" as const, value: 5 },
      },
    } as GameConfig;
    const words = generateCustomWords(config);
    expect(words).toHaveLength(5);
    // Should repeat: hello, world, hello, world, hello
    expect(words).toEqual(["hello", "world", "hello", "world", "hello"]);
  });

  it("generates words with section limit", () => {
    const config = {
      ...DEFAULT_CONFIG,
      customText: {
        text: ["hello", "world", "test", "foo"],
        mode: "repeat" as const,
        pipeDelimiter: false,
        limit: { mode: "section" as const, value: 2 },
      },
    } as GameConfig;
    const words = generateCustomWords(config);
    expect(words).toEqual(["hello", "world"]);
  });

  it("generates words for time limit mode", () => {
    const config = {
      ...DEFAULT_CONFIG,
      customText: {
        text: ["hello", "world"],
        mode: "repeat" as const,
        pipeDelimiter: false,
        limit: { mode: "time" as const, value: 30 },
      },
    } as GameConfig;
    const words = generateCustomWords(config);
    expect(words).toHaveLength(100);
  });

  it("handles repeat mode with no limit", () => {
    const config = {
      ...DEFAULT_CONFIG,
      customText: {
        text: ["hello", "world"],
        mode: "repeat" as const,
        pipeDelimiter: false,
        limit: { mode: "word" as const, value: 0 },
      },
    } as GameConfig;
    const words = generateCustomWords(config);
    expect(words.length).toBeGreaterThanOrEqual(50);
  });

  it("shuffle mode randomizes word order", () => {
    const config = {
      ...DEFAULT_CONFIG,
      customText: {
        text: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
        mode: "shuffle" as const,
        pipeDelimiter: false,
        limit: { mode: "word" as const, value: 10 },
      },
    } as GameConfig;
    // Run multiple times to check that at least one ordering differs from source
    let foundDifferent = false;
    for (let i = 0; i < 20; i++) {
      const words = generateCustomWords(config);
      expect(words).toHaveLength(10);
      if (words.join(",") !== "a,b,c,d,e,f,g,h,i,j") {
        foundDifferent = true;
        break;
      }
    }
    expect(foundDifferent).toBe(true);
  });
});

describe("generateWords - advanced", () => {
  it("returns zen words for zen mode", () => {
    const words = generateWords({ ...DEFAULT_CONFIG, mode: "zen" }, wordList);
    expect(words).toEqual([""]);
  });

  it("returns placeholder for quote mode", () => {
    const words = generateWords({ ...DEFAULT_CONFIG, mode: "quote" }, wordList);
    expect(words).toEqual(["loading", "quote..."]);
  });

  it("generates custom words for custom mode", () => {
    const config = {
      ...DEFAULT_CONFIG,
      mode: "custom" as const,
      customText: {
        text: ["hello", "world"],
        mode: "repeat" as const,
        pipeDelimiter: false,
        limit: { mode: "word" as const, value: 3 },
      },
    };
    const words = generateWords(config, wordList);
    expect(words).toHaveLength(3);
  });

  it("generates funbox words when funbox has own generator", () => {
    const words = generateWords(
      { ...DEFAULT_CONFIG, mode: "words", wordCount: 5, funbox: ["gibberish"] },
      wordList,
    );
    expect(words).toHaveLength(5);
    // Gibberish words should not be in the standard word list
    for (const w of words) {
      expect(w).toMatch(/^[a-z]+$/);
    }
  });

  it("applies funbox transforms to standard words", () => {
    const words = generateWords(
      { ...DEFAULT_CONFIG, mode: "words", wordCount: 5, funbox: ["backwards"], punctuation: false, numbers: false },
      wordList,
    );
    expect(words).toHaveLength(5);
    // Each word should be the reverse of some word in wordList
    for (const w of words) {
      const reversed = w.split("").reverse().join("");
      expect(wordList).toContain(reversed);
    }
  });

  it("applies punctuation when enabled", () => {
    // Generate enough words that punctuation statistically appears
    const words = generateWords(
      { ...DEFAULT_CONFIG, mode: "words", wordCount: 200, punctuation: true, numbers: false },
      wordList,
    );
    const hasPunctuation = words.some((w) => /[.,!?]$/.test(w));
    expect(hasPunctuation).toBe(true);
    // First word should be capitalized
    expect(words[0]![0]).toMatch(/[A-Z]/);
  });

  it("applies numbers when enabled", () => {
    const words = generateWords(
      { ...DEFAULT_CONFIG, mode: "words", wordCount: 200, numbers: true, punctuation: false },
      wordList,
    );
    const hasNumber = words.some((w) => /^\d+$/.test(w));
    expect(hasNumber).toBe(true);
  });

  it("does not apply funbox when only 'none'", () => {
    const words = generateWords(
      { ...DEFAULT_CONFIG, mode: "words", wordCount: 5, funbox: ["none"], punctuation: false, numbers: false },
      wordList,
    );
    for (const w of words) {
      expect(wordList).toContain(w);
    }
  });
});

describe("generateMoreWords - advanced", () => {
  it("uses funbox word generator when configured", () => {
    const config = { ...DEFAULT_CONFIG, funbox: ["IPv4"] } as GameConfig;
    const more = generateMoreWords(wordList, ["existing"], 3, config);
    expect(more).toHaveLength(3);
    for (const w of more) {
      // Should be valid IPv4
      expect(w.split(".")).toHaveLength(4);
    }
  });

  it("generates more custom words when in custom mode", () => {
    const config = {
      ...DEFAULT_CONFIG,
      mode: "custom" as const,
      customText: {
        text: ["alpha", "beta"],
        mode: "repeat" as const,
        pipeDelimiter: false,
        limit: { mode: "time" as const, value: 30 },
      },
    } as GameConfig;
    const more = generateMoreWords(wordList, ["existing"], 4, config);
    expect(more).toHaveLength(4);
    // All words should come from the custom text
    for (const w of more) {
      expect(["alpha", "beta"]).toContain(w);
    }
  });

  it("applies punctuation when configured", () => {
    const config = { ...DEFAULT_CONFIG, punctuation: true, numbers: false } as GameConfig;
    const more = generateMoreWords(wordList, ["existing."], 200, config);
    // Some words should have punctuation
    const hasPunct = more.some((w) => /[.,!?]$/.test(w));
    expect(hasPunct).toBe(true);
    // First word after a period should be capitalized
    expect(more[0]![0]).toMatch(/[A-Z]/);
  });

  it("applies numbers when configured", () => {
    const config = { ...DEFAULT_CONFIG, numbers: true, punctuation: false } as GameConfig;
    const more = generateMoreWords(wordList, ["existing"], 200, config);
    const hasNumber = more.some((w) => /^\d+$/.test(w));
    expect(hasNumber).toBe(true);
  });

  it("applies funbox transforms to standard words", () => {
    const config = { ...DEFAULT_CONFIG, funbox: ["backwards"], punctuation: false, numbers: false } as GameConfig;
    const more = generateMoreWords(wordList, ["existing"], 5, config);
    for (const w of more) {
      const reversed = w.split("").reverse().join("");
      expect(wordList).toContain(reversed);
    }
  });

  it("works without config parameter", () => {
    const more = generateMoreWords(wordList, ["hello"], 5);
    expect(more).toHaveLength(5);
    for (const w of more) {
      expect(wordList).toContain(w);
    }
  });
});
