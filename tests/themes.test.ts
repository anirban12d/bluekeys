import { describe, it, expect } from "vitest";
import { THEMES, getTheme, getThemeNames } from "../src/config/themes.js";

describe("THEMES", () => {
  it("has at least one theme", () => {
    expect(THEMES.length).toBeGreaterThan(0);
  });

  it("each theme has all required color fields", () => {
    const requiredFields = [
      "bg", "main", "caret", "sub", "subAlt",
      "text", "error", "errorExtra", "colorfulError", "colorfulErrorExtra",
    ];
    for (const theme of THEMES) {
      expect(theme.name).toBeTruthy();
      for (const field of requiredFields) {
        expect(theme.colors).toHaveProperty(field);
        expect((theme.colors as Record<string, string>)[field]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it("all theme names are unique", () => {
    const names = THEMES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("getTheme", () => {
  it("returns the correct theme by name", () => {
    const theme = getTheme("dracula");
    expect(theme.name).toBe("dracula");
  });

  it("returns the first theme as fallback for unknown names", () => {
    const theme = getTheme("nonexistent_theme");
    expect(theme.name).toBe(THEMES[0]!.name);
  });
});

describe("getThemeNames", () => {
  it("returns all theme names", () => {
    const names = getThemeNames();
    expect(names).toHaveLength(THEMES.length);
    expect(names).toContain("serika_dark");
    expect(names).toContain("dracula");
  });
});
