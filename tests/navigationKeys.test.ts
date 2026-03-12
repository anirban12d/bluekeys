import { describe, it, expect } from "vitest";
import { mapNavAction } from "../src/input/navigationKeys.js";

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

describe("mapNavAction - universal keys", () => {
  it("maps arrow keys in all modes", () => {
    for (const mode of ["normal", "vim", "emacs"] as const) {
      expect(mapNavAction("", { ...defaultKey, upArrow: true }, mode)).toBe("up");
      expect(mapNavAction("", { ...defaultKey, downArrow: true }, mode)).toBe("down");
      expect(mapNavAction("", { ...defaultKey, leftArrow: true }, mode)).toBe("left");
      expect(mapNavAction("", { ...defaultKey, rightArrow: true }, mode)).toBe("right");
    }
  });

  it("maps enter to confirm", () => {
    expect(mapNavAction("", { ...defaultKey, return: true }, "normal")).toBe("confirm");
  });

  it("maps escape to back", () => {
    expect(mapNavAction("", { ...defaultKey, escape: true }, "normal")).toBe("back");
  });

  it("maps tab", () => {
    expect(mapNavAction("", { ...defaultKey, tab: true }, "normal")).toBe("tab");
  });
});

describe("mapNavAction - vim mode", () => {
  it("maps hjkl to directions", () => {
    expect(mapNavAction("j", { ...defaultKey }, "vim")).toBe("down");
    expect(mapNavAction("k", { ...defaultKey }, "vim")).toBe("up");
    expect(mapNavAction("h", { ...defaultKey }, "vim")).toBe("left");
    expect(mapNavAction("l", { ...defaultKey }, "vim")).toBe("right");
  });

  it("maps q to back", () => {
    expect(mapNavAction("q", { ...defaultKey }, "vim")).toBe("back");
  });

  it("does not map vim keys in normal mode", () => {
    expect(mapNavAction("j", { ...defaultKey }, "normal")).toBeNull();
    expect(mapNavAction("k", { ...defaultKey }, "normal")).toBeNull();
    expect(mapNavAction("h", { ...defaultKey }, "normal")).toBeNull();
    expect(mapNavAction("l", { ...defaultKey }, "normal")).toBeNull();
    expect(mapNavAction("q", { ...defaultKey }, "normal")).toBeNull();
  });

  it("does not map vim keys in emacs mode", () => {
    expect(mapNavAction("j", { ...defaultKey }, "emacs")).toBeNull();
  });
});

describe("mapNavAction - emacs mode", () => {
  it("maps Ctrl+N to down", () => {
    expect(mapNavAction("\x0e", { ...defaultKey, ctrl: true }, "emacs")).toBe("down");
  });

  it("maps Ctrl+P to up", () => {
    expect(mapNavAction("\x10", { ...defaultKey, ctrl: true }, "emacs")).toBe("up");
  });

  it("maps Ctrl+B to left", () => {
    expect(mapNavAction("\x02", { ...defaultKey, ctrl: true }, "emacs")).toBe("left");
  });

  it("maps Ctrl+F to right", () => {
    expect(mapNavAction("\x06", { ...defaultKey, ctrl: true }, "emacs")).toBe("right");
  });

  it("maps Ctrl+G to back", () => {
    expect(mapNavAction("\x07", { ...defaultKey, ctrl: true }, "emacs")).toBe("back");
  });

  it("does not map emacs keys in normal mode", () => {
    expect(mapNavAction("\x0e", { ...defaultKey, ctrl: true }, "normal")).toBeNull();
  });

  it("does not map emacs keys without ctrl", () => {
    expect(mapNavAction("\x0e", { ...defaultKey }, "emacs")).toBeNull();
  });
});

describe("mapNavAction - unrecognized input", () => {
  it("returns null for random chars in normal mode", () => {
    expect(mapNavAction("x", { ...defaultKey }, "normal")).toBeNull();
  });
});
