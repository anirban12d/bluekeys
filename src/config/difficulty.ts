import type { GameConfig } from "../engine/types.js";

export const DEFAULT_CONFIG: GameConfig = {
  // Core mode
  mode: "time",
  timeLimit: 30,
  wordCount: 50,
  quoteLength: [1],
  language: "english",

  // Content
  punctuation: false,
  numbers: false,

  // Behavior
  difficulty: "normal",
  quickRestart: "tab",
  blindMode: false,
  lazyMode: false,
  freedomMode: false,
  confidenceMode: "off",
  stopOnError: "off",
  strictSpace: false,
  quickEnd: true,
  indicateTypos: "replace",
  hideExtraLetters: false,

  // Fail conditions
  minWpm: "off",
  minWpmCustomSpeed: 0,
  minAcc: "off",
  minAccCustom: 0,
  minBurst: "off",
  minBurstCustomSpeed: 0,

  // Caret
  caretStyle: "default",
  smoothCaret: "off",
  paceCaret: "off",
  paceCaretCustomSpeed: 100,

  // Display
  timerStyle: "bar",
  timerColor: "main",
  timerOpacity: "1",
  liveSpeedStyle: "mini",
  liveAccStyle: "off",
  liveBurstStyle: "off",
  highlightMode: "letter",
  typedEffect: "keep",
  tapeMode: "off",
  showAllLines: false,

  // Stats display
  typingSpeedUnit: "wpm",
  alwaysShowDecimalPlaces: false,
  startGraphsAtZero: false,

  // Theme
  theme: "serika_dark",
  flipTestColors: false,
  colorfulMode: false,

  // UI
  showKeyTips: true,
  capsLockWarning: true,
  repeatQuotes: "off",
  showAverage: "off",
  showPb: true,
  showOutOfFocusWarning: true,

  // Keybinding mode
  keybindingMode: "normal",

  // Funbox
  funbox: ["none"],

  // Custom text
  customText: null,

  // Code snippets
  codeLanguage: "python",

  // CLI commands
  cliCategory: "general",
};

export const TIME_LIMITS = [15, 30, 60, 120] as const;
export const WORD_COUNTS = [10, 25, 50, 100, 200] as const;
export const QUOTE_LENGTHS = [
  { value: 0 as const, label: "short" },
  { value: 1 as const, label: "medium" },
  { value: 2 as const, label: "long" },
  { value: 3 as const, label: "thicc" },
];

export const CODE_LANGUAGES = ["python", "javascript", "go", "rust"] as const;
export const CLI_CATEGORIES = ["general", "git", "docker", "npm", "linux"] as const;

export const SNIPPET_LENGTHS = [
  { value: 0 as const, label: "short" },
  { value: 1 as const, label: "medium" },
  { value: 2 as const, label: "long" },
  { value: 3 as const, label: "thicc" },
];

export const COMMAND_LENGTHS = [
  { value: 0 as const, label: "short" },
  { value: 1 as const, label: "medium" },
  { value: 2 as const, label: "long" },
  { value: 3 as const, label: "thicc" },
];

// ── Config metadata for settings UI ─────────────────────────────────

export interface ConfigOption<T> {
  key: string;
  label: string;
  values: readonly T[];
  format?: (v: T) => string;
  category: string;
}

export const CONFIG_CATEGORIES = [
  "test",
  "behavior",
  "input",
  "caret",
  "appearance",
  "theme",
  "danger zone",
] as const;
