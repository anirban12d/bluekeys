import { describe, it, expect } from "vitest";
import {
  roundTo2,
  convertSpeed,
  formatSpeed,
  formatWpm,
  formatAccuracy,
  formatTime,
} from "../src/utils/format.js";

describe("roundTo2", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundTo2(3.14159)).toBe(3.14);
  });

  it("rounds to 2 places for typical values", () => {
    expect(roundTo2(1.456)).toBe(1.46);
  });

  it("keeps integers as-is", () => {
    expect(roundTo2(5)).toBe(5);
  });

  it("handles 0", () => {
    expect(roundTo2(0)).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(roundTo2(-3.14159)).toBe(-3.14);
  });
});

describe("convertSpeed", () => {
  it("returns wpm unchanged for 'wpm' unit", () => {
    expect(convertSpeed(60, "wpm")).toBe(60);
  });

  it("converts to cpm (wpm * 5)", () => {
    expect(convertSpeed(60, "cpm")).toBe(300);
  });

  it("converts to wps (wpm / 60)", () => {
    expect(convertSpeed(60, "wps")).toBe(1);
  });

  it("converts to cps (wpm * 5 / 60)", () => {
    expect(convertSpeed(60, "cps")).toBe(5);
  });

  it("converts to wph (wpm * 60)", () => {
    expect(convertSpeed(60, "wph")).toBe(3600);
  });

  it("handles 0 wpm", () => {
    expect(convertSpeed(0, "cpm")).toBe(0);
    expect(convertSpeed(0, "wps")).toBe(0);
  });
});

describe("formatSpeed", () => {
  it("formats with integer by default", () => {
    expect(formatSpeed(60, "wpm")).toBe("60 wpm");
  });

  it("formats with decimals when requested", () => {
    expect(formatSpeed(60, "wpm", true)).toBe("60.00 wpm");
  });

  it("formats cpm correctly", () => {
    expect(formatSpeed(60, "cpm")).toBe("300 cpm");
  });

  it("rounds to nearest integer by default", () => {
    expect(formatSpeed(65.7, "wpm")).toBe("66 wpm");
  });

  it("shows 2 decimal places with decimals flag", () => {
    expect(formatSpeed(65.7, "wps", true)).toBe("1.10 wps");
  });
});

describe("formatWpm", () => {
  it("rounds to integer string", () => {
    expect(formatWpm(65.4)).toBe("65");
    expect(formatWpm(65.6)).toBe("66");
  });

  it("handles 0", () => {
    expect(formatWpm(0)).toBe("0");
  });
});

describe("formatAccuracy", () => {
  it("formats with percent sign", () => {
    expect(formatAccuracy(100)).toBe("100%");
  });

  it("keeps 2 decimal places", () => {
    expect(formatAccuracy(98.765)).toBe("98.77%");
  });

  it("handles 0%", () => {
    expect(formatAccuracy(0)).toBe("0%");
  });
});

describe("formatTime", () => {
  it("formats seconds only when under a minute", () => {
    expect(formatTime(45)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(90)).toBe("1:30");
  });

  it("pads seconds with leading zero", () => {
    expect(formatTime(65)).toBe("1:05");
  });

  it("handles 0 seconds", () => {
    expect(formatTime(0)).toBe("0s");
  });

  it("handles exact minutes", () => {
    expect(formatTime(120)).toBe("2:00");
  });
});
