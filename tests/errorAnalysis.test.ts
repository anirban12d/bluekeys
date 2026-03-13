import { describe, it, expect } from "vitest";
import { computeErrorHeatmap } from "../src/engine/errorAnalysis.js";

describe("computeErrorHeatmap", () => {
  it("returns empty array when no errors", () => {
    const result = computeErrorHeatmap(
      ["hello", "world"],
      ["hello", "world"],
      2,
    );
    expect(result).toEqual([]);
  });

  it("returns empty array when history is empty", () => {
    const result = computeErrorHeatmap([], ["hello", "world"], 0);
    expect(result).toEqual([]);
  });

  it("detects a single-char typo", () => {
    const result = computeErrorHeatmap(
      ["helo"],
      ["hello"],
      1,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.target).toBe("hello");
    expect(result[0]!.errorCount).toBe(1);
    expect(result[0]!.typedVariants).toEqual(["helo"]);
  });

  it("detects extra chars", () => {
    const result = computeErrorHeatmap(
      ["helloo"],
      ["hello"],
      1,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.target).toBe("hello");
    expect(result[0]!.typedVariants).toEqual(["helloo"]);
  });

  it("detects missing chars", () => {
    const result = computeErrorHeatmap(
      ["hel"],
      ["hello"],
      1,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.target).toBe("hello");
    // Chars at index 3 and 4 should have error rate 1.0
    expect(result[0]!.charErrorRates[3]).toBe(1);
    expect(result[0]!.charErrorRates[4]).toBe(1);
  });

  it("aggregates same word mistyped multiple times", () => {
    const result = computeErrorHeatmap(
      ["teh", "world", "tge", "world", "th"],
      ["the", "world", "the", "world", "the"],
      5,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.target).toBe("the");
    expect(result[0]!.errorCount).toBe(3);
    expect(result[0]!.typedVariants).toEqual(["teh", "tge", "th"]);
  });

  it("computes per-character error rates correctly", () => {
    // "the" typed as "teh" (h and e swapped) and "the" (correct once)
    // and "txe" (h wrong)
    const result = computeErrorHeatmap(
      ["teh", "the", "txe"],
      ["the", "the", "the"],
      3,
    );
    expect(result).toHaveLength(1);
    const info = result[0]!;
    expect(info.errorCount).toBe(2);
    // 3 total occurrences of "the"
    // position 0 ('t'): correct in all → rate 0
    expect(info.charErrorRates[0]).toBeCloseTo(0);
    // position 1 ('h'): wrong in "teh" (has 'e') and "txe" (has 'x') → 2/3
    expect(info.charErrorRates[1]).toBeCloseTo(2 / 3);
    // position 2 ('e'): wrong in "teh" (has 'h'), correct in "txe" → 1/3
    expect(info.charErrorRates[2]).toBeCloseTo(1 / 3);
  });

  it("sorts by error count descending", () => {
    const result = computeErrorHeatmap(
      ["woudl", "thier", "woudl"],
      ["would", "their", "would"],
      3,
    );
    expect(result).toHaveLength(2);
    expect(result[0]!.target).toBe("would");
    expect(result[0]!.errorCount).toBe(2);
    expect(result[1]!.target).toBe("their");
    expect(result[1]!.errorCount).toBe(1);
  });

  it("respects activeWordIndex boundary", () => {
    // Only 2 words completed out of 4
    const result = computeErrorHeatmap(
      ["teh", "world"],
      ["the", "world", "bad", "words"],
      2,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.target).toBe("the");
  });

  it("handles words where history is shorter than activeWordIndex", () => {
    // activeWordIndex is 3 but history only has 2 entries (time mode partial)
    const result = computeErrorHeatmap(
      ["teh", "world"],
      ["the", "world", "test"],
      3,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.target).toBe("the");
  });
});
