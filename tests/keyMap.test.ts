import { describe, it, expect } from "vitest";
import { mapKeyToEvent } from "../src/input/keyMap.js";

const defaultKey = {
  upArrow: false,
  downArrow: false,
  leftArrow: false,
  rightArrow: false,
  pageDown: false,
  pageUp: false,
  return: false,
  escape: false,
  ctrl: false,
  shift: false,
  tab: false,
  backspace: false,
  delete: false,
  meta: false,
};

describe("mapKeyToEvent", () => {
  it("maps printable character to INSERT_CHAR", () => {
    const event = mapKeyToEvent("a", { ...defaultKey });
    expect(event).not.toBeNull();
    expect(event!.type).toBe("INSERT_CHAR");
    if (event!.type === "INSERT_CHAR") {
      expect(event!.char).toBe("a");
    }
  });

  it("maps space to INSERT_CHAR", () => {
    const event = mapKeyToEvent(" ", { ...defaultKey });
    expect(event).not.toBeNull();
    expect(event!.type).toBe("INSERT_CHAR");
    if (event!.type === "INSERT_CHAR") {
      expect(event!.char).toBe(" ");
    }
  });

  it("maps backspace to DELETE_CHAR", () => {
    const event = mapKeyToEvent("", { ...defaultKey, backspace: true });
    expect(event).toEqual({ type: "DELETE_CHAR" });
  });

  it("maps delete key to DELETE_CHAR", () => {
    const event = mapKeyToEvent("", { ...defaultKey, delete: true });
    expect(event).toEqual({ type: "DELETE_CHAR" });
  });

  it("maps ctrl+backspace to DELETE_WORD", () => {
    const event = mapKeyToEvent("", { ...defaultKey, backspace: true, ctrl: true });
    expect(event).toEqual({ type: "DELETE_WORD" });
  });

  it("maps meta+backspace to DELETE_WORD", () => {
    const event = mapKeyToEvent("", { ...defaultKey, backspace: true, meta: true });
    expect(event).toEqual({ type: "DELETE_WORD" });
  });

  it("maps ctrl+delete to DELETE_WORD", () => {
    const event = mapKeyToEvent("", { ...defaultKey, delete: true, ctrl: true });
    expect(event).toEqual({ type: "DELETE_WORD" });
  });

  it("returns null for tab", () => {
    expect(mapKeyToEvent("", { ...defaultKey, tab: true })).toBeNull();
  });

  it("returns null for escape", () => {
    expect(mapKeyToEvent("", { ...defaultKey, escape: true })).toBeNull();
  });

  it("returns null for return/enter", () => {
    expect(mapKeyToEvent("", { ...defaultKey, return: true })).toBeNull();
  });

  it("returns null for arrow keys", () => {
    expect(mapKeyToEvent("", { ...defaultKey, upArrow: true })).toBeNull();
    expect(mapKeyToEvent("", { ...defaultKey, downArrow: true })).toBeNull();
    expect(mapKeyToEvent("", { ...defaultKey, leftArrow: true })).toBeNull();
    expect(mapKeyToEvent("", { ...defaultKey, rightArrow: true })).toBeNull();
  });

  it("returns null for page up/down", () => {
    expect(mapKeyToEvent("", { ...defaultKey, pageUp: true })).toBeNull();
    expect(mapKeyToEvent("", { ...defaultKey, pageDown: true })).toBeNull();
  });

  it("returns null for ctrl combos (non-backspace)", () => {
    expect(mapKeyToEvent("c", { ...defaultKey, ctrl: true })).toBeNull();
  });

  it("maps raw terminal backspace \\x7f to DELETE_CHAR", () => {
    const event = mapKeyToEvent("\x7f", { ...defaultKey });
    expect(event).toEqual({ type: "DELETE_CHAR" });
  });

  it("maps raw terminal backspace \\x08 to DELETE_CHAR", () => {
    const event = mapKeyToEvent("\x08", { ...defaultKey });
    expect(event).toEqual({ type: "DELETE_CHAR" });
  });

  it("returns null for multi-character input", () => {
    expect(mapKeyToEvent("abc", { ...defaultKey })).toBeNull();
  });

  it("returns null for empty string input without special keys", () => {
    expect(mapKeyToEvent("", { ...defaultKey })).toBeNull();
  });
});
