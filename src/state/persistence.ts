import type { GameConfig, PersonalBest, FinalResult } from "../engine/types.js";
import { DEFAULT_CONFIG } from "../config/difficulty.js";
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import * as TOML from "smol-toml";

// ── Config directory ────────────────────────────────────────────────

function getConfigDir(): string {
  if (process.platform === "win32") {
    // Windows: use %APPDATA% (e.g. C:\Users\<user>\AppData\Roaming)
    const appData = process.env["APPDATA"];
    if (appData) return join(appData, ".bluekeys");
  }
  // macOS / Linux: ~/.bluekeys
  return join(homedir(), ".bluekeys");
}

const DATA_DIR = getConfigDir();
const CONFIG_FILE = join(DATA_DIR, "config.toml");
const LEGACY_CONFIG_FILE = join(DATA_DIR, "config.json");
const PB_FILE = join(DATA_DIR, "pb.json");
const RESULTS_FILE = join(DATA_DIR, "results.ndjson");

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(path: string, data: unknown): void {
  ensureDir();
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

// ── TOML config generation ──────────────────────────────────────────

function generateConfigToml(config: GameConfig): string {
  const lines: string[] = [
    "# Bluekeys Configuration",
    "# Edit this file to customize your typing test.",
    "# Changes take effect the next time you launch bluekeys.",
    "",
    "# ── Test ─────────────────────────────────────────────────────────",
    "",
    `# mode: time | words | quote | code | cli | zen | custom`,
    `mode = ${q(config.mode)}`,
    ``,
    `# Time limit in seconds (used when mode = "time")`,
    `timeLimit = ${config.timeLimit}`,
    ``,
    `# Word count (used when mode = "words")`,
    `wordCount = ${config.wordCount}`,
    ``,
    `# Quote length: 0 = short, 1 = medium, 2 = long, 3 = thicc`,
    `quoteLength = ${JSON.stringify(config.quoteLength)}`,
    ``,
    `language = ${q(config.language)}`,
    `punctuation = ${config.punctuation}`,
    `numbers = ${config.numbers}`,
    ``,
    `# Code snippets language (used when mode = "code")`,
    `# Available: python, javascript, go, rust`,
    `codeLanguage = ${q(config.codeLanguage)}`,
    ``,
    `# CLI commands category (used when mode = "cli")`,
    `# Available: general, git, docker, npm, linux`,
    `cliCategory = ${q(config.cliCategory)}`,
    ``,
    `# ── Behavior ──────────────────────────────────────────────────────`,
    ``,
    `# difficulty: normal | expert | master`,
    `difficulty = ${q(config.difficulty)}`,
    ``,
    `# quickRestart: off | tab | esc | enter`,
    `quickRestart = ${q(config.quickRestart)}`,
    ``,
    `blindMode = ${config.blindMode}`,
    `lazyMode = ${config.lazyMode}`,
    `freedomMode = ${config.freedomMode}`,
    ``,
    `# confidenceMode: off | on | max`,
    `confidenceMode = ${q(config.confidenceMode)}`,
    ``,
    `# stopOnError: off | word | letter`,
    `stopOnError = ${q(config.stopOnError)}`,
    ``,
    `strictSpace = ${config.strictSpace}`,
    `quickEnd = ${config.quickEnd}`,
    ``,
    `# indicateTypos: off | below | replace`,
    `indicateTypos = ${q(config.indicateTypos)}`,
    ``,
    `hideExtraLetters = ${config.hideExtraLetters}`,
    ``,
    `# keybindingMode: normal | vim | emacs`,
    `# Controls navigation keys in menus and settings.`,
    `# Has no effect during typing.`,
    `keybindingMode = ${q(config.keybindingMode)}`,
    ``,
    `# ── Input thresholds ──────────────────────────────────────────────`,
    ``,
    `# minWpm: off | custom`,
    `minWpm = ${q(config.minWpm)}`,
    `minWpmCustomSpeed = ${config.minWpmCustomSpeed}`,
    ``,
    `# minAcc: off | custom`,
    `minAcc = ${q(config.minAcc)}`,
    `minAccCustom = ${config.minAccCustom}`,
    ``,
    `# minBurst: off | fixed | flex`,
    `minBurst = ${q(config.minBurst)}`,
    `minBurstCustomSpeed = ${config.minBurstCustomSpeed}`,
    ``,
    `# ── Caret ────────────────────────────────────────────────────────`,
    ``,
    `# caretStyle: off | default | block | outline | underline`,
    `caretStyle = ${q(config.caretStyle)}`,
    ``,
    `# smoothCaret: off | slow | medium | fast`,
    `smoothCaret = ${q(config.smoothCaret)}`,
    ``,
    `# paceCaret: off | average | pb | last | custom | daily`,
    `paceCaret = ${q(config.paceCaret)}`,
    `paceCaretCustomSpeed = ${config.paceCaretCustomSpeed}`,
    ``,
    `# ── Display ──────────────────────────────────────────────────────`,
    ``,
    `# timerStyle: off | bar | text | mini`,
    `timerStyle = ${q(config.timerStyle)}`,
    ``,
    `# timerColor: main | sub | text`,
    `timerColor = ${q(config.timerColor)}`,
    ``,
    `# timerOpacity: "0.25" | "0.5" | "0.75" | "1"`,
    `timerOpacity = ${q(config.timerOpacity)}`,
    ``,
    `# liveSpeedStyle / liveAccStyle / liveBurstStyle: off | text | mini`,
    `liveSpeedStyle = ${q(config.liveSpeedStyle)}`,
    `liveAccStyle = ${q(config.liveAccStyle)}`,
    `liveBurstStyle = ${q(config.liveBurstStyle)}`,
    ``,
    `# highlightMode: off | letter | word | next_word | next_two_words | next_three_words`,
    `highlightMode = ${q(config.highlightMode)}`,
    ``,
    `# typedEffect: keep | fade | hide`,
    `typedEffect = ${q(config.typedEffect)}`,
    ``,
    `# tapeMode: off | letter | word`,
    `tapeMode = ${q(config.tapeMode)}`,
    ``,
    `showAllLines = ${config.showAllLines}`,
    ``,
    `# ── Stats ────────────────────────────────────────────────────────`,
    ``,
    `# typingSpeedUnit: wpm | cpm | wps | cps | wph`,
    `typingSpeedUnit = ${q(config.typingSpeedUnit)}`,
    ``,
    `alwaysShowDecimalPlaces = ${config.alwaysShowDecimalPlaces}`,
    `startGraphsAtZero = ${config.startGraphsAtZero}`,
    ``,
    `# ── Theme ────────────────────────────────────────────────────────`,
    ``,
    `theme = ${q(config.theme)}`,
    `flipTestColors = ${config.flipTestColors}`,
    `colorfulMode = ${config.colorfulMode}`,
    ``,
    `# ── UI ────────────────────────────────────────────────────────────`,
    ``,
    `showKeyTips = ${config.showKeyTips}`,
    `capsLockWarning = ${config.capsLockWarning}`,
    ``,
    `# repeatQuotes: off | typing`,
    `repeatQuotes = ${q(config.repeatQuotes)}`,
    ``,
    `# showAverage: off | speed | acc | both`,
    `showAverage = ${q(config.showAverage)}`,
    ``,
    `showPb = ${config.showPb}`,
    `showOutOfFocusWarning = ${config.showOutOfFocusWarning}`,
    ``,
    `# ── Funbox ───────────────────────────────────────────────────────`,
    ``,
    `# Available: none, mirror, upside_down, rAnDoMcAsE, capitals, nospace,`,
    `#   backwards, ddoouubblleedd, underscore_spaces, memory, read_ahead,`,
    `#   read_ahead_easy, read_ahead_hard, no_quit, gibberish, specials,`,
    `#   IPv4, IPv6, binary, hexadecimal, rot13, instant_messaging, zipf,`,
    `#   pseudolang, poetry`,
    `funbox = ${JSON.stringify(config.funbox)}`,
    ``,
  ];

  return lines.join("\n");
}

/** Quote a string value for TOML */
function q(value: string): string {
  return `"${value}"`;
}

// ── Config ──────────────────────────────────────────────────────────

function migrateFromJson(): Partial<GameConfig> | null {
  if (!existsSync(LEGACY_CONFIG_FILE)) return null;
  try {
    const stored = JSON.parse(readFileSync(LEGACY_CONFIG_FILE, "utf-8")) as Partial<GameConfig>;
    // Remove legacy file after successful read
    unlinkSync(LEGACY_CONFIG_FILE);
    return stored;
  } catch {
    return null;
  }
}

export function loadConfig(): GameConfig {
  ensureDir();

  // Try loading TOML config
  if (existsSync(CONFIG_FILE)) {
    try {
      const content = readFileSync(CONFIG_FILE, "utf-8");
      const parsed = TOML.parse(content) as Partial<GameConfig>;
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      // If TOML is malformed, fall through to defaults
    }
  }

  // Migrate from legacy config.json if it exists
  const legacy = migrateFromJson();
  if (legacy) {
    const config = { ...DEFAULT_CONFIG, ...legacy };
    saveConfig(config);
    return config;
  }

  // First run: generate default config file
  saveConfig(DEFAULT_CONFIG);
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: GameConfig): void {
  ensureDir();
  const toml = generateConfigToml(config);
  writeFileSync(CONFIG_FILE, toml, "utf-8");
}

// ── Personal Bests ──────────────────────────────────────────────────

export function loadPersonalBests(): PersonalBest[] {
  return readJson<PersonalBest[]>(PB_FILE, []);
}

export function savePersonalBests(pbs: PersonalBest[]): void {
  writeJson(PB_FILE, pbs);
}

function pbKey(result: FinalResult | PersonalBest): string {
  return `${result.mode}|${result.mode2}|${result.language}|${result.punctuation}|${result.numbers}|${result.difficulty}|${result.lazyMode}`;
}

export function checkAndUpdatePb(result: FinalResult): boolean {
  const pbs = loadPersonalBests();
  const key = pbKey(result);
  const existing = pbs.find((pb) => pbKey(pb) === key);

  if (!existing || result.wpm > existing.wpm) {
    const newPb: PersonalBest = {
      wpm: result.wpm,
      rawWpm: result.rawWpm,
      accuracy: result.accuracy,
      consistency: result.consistency,
      timestamp: result.timestamp,
      mode: result.mode,
      mode2: result.mode2,
      language: result.language,
      punctuation: result.punctuation,
      numbers: result.numbers,
      difficulty: result.difficulty,
      lazyMode: result.lazyMode,
    };

    if (existing) {
      const idx = pbs.indexOf(existing);
      pbs[idx] = newPb;
    } else {
      pbs.push(newPb);
    }

    savePersonalBests(pbs);
    return true;
  }

  return false;
}

export function getPb(
  mode: string,
  mode2: number | string,
  language: string,
  punctuation: boolean,
  numbers: boolean,
  difficulty: string,
  lazyMode: boolean,
): PersonalBest | null {
  const pbs = loadPersonalBests();
  const key = `${mode}|${mode2}|${language}|${punctuation}|${numbers}|${difficulty}|${lazyMode}`;
  return pbs.find((pb) => pbKey(pb) === key) ?? null;
}

// ── Results ─────────────────────────────────────────────────────────

export function appendResult(result: FinalResult): void {
  ensureDir();
  const line = JSON.stringify(result) + "\n";
  try {
    const existing = existsSync(RESULTS_FILE) ? readFileSync(RESULTS_FILE, "utf-8") : "";
    writeFileSync(RESULTS_FILE, existing + line, "utf-8");
  } catch {
    writeFileSync(RESULTS_FILE, line, "utf-8");
  }
}

export function loadResults(limit = 100): FinalResult[] {
  try {
    const content = readFileSync(RESULTS_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    return lines
      .slice(-limit)
      .map((line) => JSON.parse(line) as FinalResult);
  } catch {
    return [];
  }
}

export function getAverageWpm(mode: string, mode2: number | string, count = 10): number {
  const results = loadResults(1000).filter(
    (r) => r.mode === mode && String(r.mode2) === String(mode2),
  );
  const last = results.slice(-count);
  if (last.length === 0) return 0;
  return last.reduce((sum, r) => sum + r.wpm, 0) / last.length;
}
