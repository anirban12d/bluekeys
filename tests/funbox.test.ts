import { describe, it, expect } from "vitest";
import {
  FUNBOX_LIST,
  getFunbox,
  applyFunboxTransform,
  generateFunboxWord,
} from "../src/constants/funbox/index.js";

describe("getFunbox", () => {
  it("returns the definition for a known funbox", () => {
    const fb = getFunbox("mirror");
    expect(fb).toBeDefined();
    expect(fb!.name).toBe("mirror");
  });

  it("returns the 'none' funbox", () => {
    const fb = getFunbox("none");
    expect(fb).toBeDefined();
    expect(fb!.label).toBe("none");
  });

  it("returns undefined for an unknown name", () => {
    // @ts-expect-error testing invalid input
    const fb = getFunbox("totally_fake_funbox");
    expect(fb).toBeUndefined();
  });
});

describe("FUNBOX_LIST", () => {
  it("has unique names", () => {
    const names = FUNBOX_LIST.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all entries have name, label, and description", () => {
    for (const fb of FUNBOX_LIST) {
      expect(fb.name).toBeTruthy();
      expect(fb.label).toBeTruthy();
      expect(fb.description).toBeTruthy();
    }
  });
});

describe("applyFunboxTransform", () => {
  it("returns word unchanged for 'none' funbox", () => {
    expect(applyFunboxTransform("hello", ["none"])).toBe("hello");
  });

  it("applies mirror transform", () => {
    const result = applyFunboxTransform("ab", ["mirror"]);
    // "ab" mirrored: reversed + character substitution
    expect(result).not.toBe("ab");
    expect(result.length).toBe(2);
  });

  it("applies upside_down transform (reverse)", () => {
    expect(applyFunboxTransform("abc", ["upside_down"])).toBe("cba");
  });

  it("applies capitals transform", () => {
    const result = applyFunboxTransform("hello", ["capitals"]);
    expect(result).toBe("Hello");
  });

  it("applies backwards transform", () => {
    expect(applyFunboxTransform("hello", ["backwards"])).toBe("olleh");
  });

  it("applies ddoouubblleedd transform", () => {
    expect(applyFunboxTransform("hi", ["ddoouubblleedd"])).toBe("hhii");
  });

  it("applies rot13 transform", () => {
    // rot13("hello") = "uryyb"
    expect(applyFunboxTransform("hello", ["rot13"])).toBe("uryyb");
    // rot13 twice returns the original
    expect(applyFunboxTransform("uryyb", ["rot13"])).toBe("hello");
  });

  it("applies instant_messaging transform (lowercase)", () => {
    expect(applyFunboxTransform("HELLO", ["instant_messaging"])).toBe("hello");
  });

  it("chains multiple transforms", () => {
    // capitals then backwards: "hello" -> "Hello" -> "olleH"
    const result = applyFunboxTransform("hello", ["capitals", "backwards"]);
    expect(result).toBe("olleH");
  });

  it("skips funboxes without wordTransform", () => {
    // "nospace" has spaceReplacement but no wordTransform
    expect(applyFunboxTransform("hello", ["nospace"])).toBe("hello");
  });
});

describe("generateFunboxWord", () => {
  it("generates gibberish with consonant-vowel pattern", () => {
    for (let i = 0; i < 10; i++) {
      const word = generateFunboxWord("gibberish");
      expect(word.length).toBeGreaterThanOrEqual(3);
      expect(word.length).toBeLessThanOrEqual(8);
      // Check alternating consonant/vowel pattern
      const consonants = "bcdfghjklmnpqrstvwxyz";
      const vowels = "aeiou";
      for (let j = 0; j < word.length; j++) {
        const pool = j % 2 === 0 ? consonants : vowels;
        expect(pool).toContain(word[j]);
      }
    }
  });

  it("generates specials with special characters", () => {
    const specialChars = "!@#$%^&*()-_=+[]{}|;:',.<>?/~`";
    for (let i = 0; i < 10; i++) {
      const word = generateFunboxWord("specials");
      expect(word.length).toBeGreaterThanOrEqual(2);
      expect(word.length).toBeLessThanOrEqual(6);
      for (const c of word) {
        expect(specialChars).toContain(c);
      }
    }
  });

  it("generates valid IPv4 addresses", () => {
    for (let i = 0; i < 10; i++) {
      const word = generateFunboxWord("IPv4");
      const parts = word.split(".");
      expect(parts).toHaveLength(4);
      for (const part of parts) {
        const num = Number(part);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(256);
      }
    }
  });

  it("generates valid IPv6 addresses", () => {
    for (let i = 0; i < 5; i++) {
      const word = generateFunboxWord("IPv6");
      const parts = word.split(":");
      expect(parts).toHaveLength(8);
      for (const part of parts) {
        expect(part).toMatch(/^[0-9a-f]{4}$/);
      }
    }
  });

  it("generates binary strings", () => {
    for (let i = 0; i < 10; i++) {
      const word = generateFunboxWord("binary");
      expect(word.length).toBeGreaterThanOrEqual(4);
      expect(word.length).toBeLessThanOrEqual(12);
      expect(word).toMatch(/^[01]+$/);
    }
  });

  it("generates hexadecimal strings with 0x prefix", () => {
    for (let i = 0; i < 10; i++) {
      const word = generateFunboxWord("hexadecimal");
      expect(word).toMatch(/^0x[0-9a-f]+$/);
      // "0x" + 2-8 hex chars
      const hexPart = word.slice(2);
      expect(hexPart.length).toBeGreaterThanOrEqual(2);
      expect(hexPart.length).toBeLessThanOrEqual(8);
    }
  });

  it("generates pseudolang words from syllables", () => {
    const syllables = ["ba", "ka", "mi", "ro", "te", "nu", "fu", "sa", "li", "po", "de", "wa"];
    for (let i = 0; i < 10; i++) {
      const word = generateFunboxWord("pseudolang");
      expect(word.length).toBeGreaterThanOrEqual(2);
      expect(word.length).toBeLessThanOrEqual(8);
      // Should be composed of known syllables
      let remaining = word;
      while (remaining.length > 0) {
        const matched = syllables.find((s) => remaining.startsWith(s));
        expect(matched).toBeDefined();
        remaining = remaining.slice(matched!.length);
      }
    }
  });

  it("returns 'word' for unknown funbox", () => {
    // @ts-expect-error testing default case
    expect(generateFunboxWord("unknown_funbox")).toBe("word");
  });
});
