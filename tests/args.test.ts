import { describe, it, expect } from "vitest";
import { parseArgs } from "../src/cli/args.js";

describe("parseArgs", () => {
  it("returns null for empty args", () => {
    expect(parseArgs([])).toBeNull();
  });

  it("parses --mode time", () => {
    const config = parseArgs(["--mode", "time"]);
    expect(config).not.toBeNull();
    expect(config!.mode).toBe("time");
  });

  it("parses -m words", () => {
    const config = parseArgs(["-m", "words"]);
    expect(config).not.toBeNull();
    expect(config!.mode).toBe("words");
  });

  it("parses --time flag", () => {
    const config = parseArgs(["--time", "60"]);
    expect(config).not.toBeNull();
    expect(config!.timeLimit).toBe(60);
    // mode inferred as "time" when no explicit mode
    expect(config!.mode).toBe("time");
  });

  it("parses -t shorthand", () => {
    const config = parseArgs(["-t", "15"]);
    expect(config!.timeLimit).toBe(15);
  });

  it("parses --words flag", () => {
    const config = parseArgs(["--words", "25"]);
    expect(config).not.toBeNull();
    expect(config!.wordCount).toBe(25);
    // mode inferred as "words"
    expect(config!.mode).toBe("words");
  });

  it("parses -w shorthand", () => {
    const config = parseArgs(["-w", "100"]);
    expect(config!.wordCount).toBe(100);
    expect(config!.mode).toBe("words");
  });

  it("parses --language flag", () => {
    const config = parseArgs(["--language", "spanish"]);
    expect(config!.language).toBe("spanish");
  });

  it("parses -l shorthand", () => {
    const config = parseArgs(["-l", "french"]);
    expect(config!.language).toBe("french");
  });

  it("parses --punctuation", () => {
    const config = parseArgs(["--punctuation"]);
    expect(config!.punctuation).toBe(true);
  });

  it("parses --no-punctuation", () => {
    const config = parseArgs(["--no-punctuation"]);
    expect(config!.punctuation).toBe(false);
  });

  it("parses --numbers", () => {
    const config = parseArgs(["--numbers"]);
    expect(config!.numbers).toBe(true);
  });

  it("parses --no-numbers", () => {
    const config = parseArgs(["--no-numbers"]);
    expect(config!.numbers).toBe(false);
  });

  it("parses --difficulty normal", () => {
    const config = parseArgs(["--difficulty", "normal"]);
    expect(config!.difficulty).toBe("normal");
  });

  it("parses --difficulty expert", () => {
    const config = parseArgs(["--difficulty", "expert"]);
    expect(config!.difficulty).toBe("expert");
  });

  it("parses --difficulty master", () => {
    const config = parseArgs(["--difficulty", "master"]);
    expect(config!.difficulty).toBe("master");
  });

  it("parses --theme", () => {
    const config = parseArgs(["--theme", "dracula"]);
    expect(config!.theme).toBe("dracula");
  });

  it("parses --quote-length", () => {
    const config = parseArgs(["--quote-length", "2"]);
    expect(config!.quoteLength).toEqual([2]);
    // mode inferred as "quote"
    expect(config!.mode).toBe("quote");
  });

  it("ignores invalid quote length", () => {
    const config = parseArgs(["--quote-length", "5", "--punctuation"]);
    // quoteLength should remain default since 5 is out of range
    expect(config!.quoteLength).toEqual([1]); // default
  });

  it("ignores invalid mode values", () => {
    const config = parseArgs(["-m", "invalid", "--punctuation"]);
    // mode stays null, inferred as "time"
    expect(config!.mode).toBe("time");
  });

  it("parses multiple flags together", () => {
    const config = parseArgs([
      "-m", "words",
      "-w", "50",
      "--punctuation",
      "--numbers",
      "--difficulty", "expert",
      "--theme", "nord",
      "-l", "english",
    ]);
    expect(config!.mode).toBe("words");
    expect(config!.wordCount).toBe(50);
    expect(config!.punctuation).toBe(true);
    expect(config!.numbers).toBe(true);
    expect(config!.difficulty).toBe("expert");
    expect(config!.theme).toBe("nord");
    expect(config!.language).toBe("english");
  });

  it("uses defaults for unprovided options", () => {
    const config = parseArgs(["--punctuation"]);
    expect(config!.mode).toBe("time"); // default inference
    expect(config!.timeLimit).toBe(30); // default
    expect(config!.wordCount).toBe(50); // default
    expect(config!.language).toBe("english"); // default
    expect(config!.difficulty).toBe("normal"); // default
  });

  it("ignores non-numeric time values", () => {
    const config = parseArgs(["-t", "abc", "--punctuation"]);
    expect(config!.timeLimit).toBe(30); // default
  });
});
