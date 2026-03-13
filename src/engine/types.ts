// ── Game Phases & Modes ──────────────────────────────────────────────

export type GamePhase =
  | "menu"
  | "ready"
  | "active"
  | "finished"
  | "failed"
  | "settings"
  | "customText";

export type GameMode = "time" | "words" | "quote" | "code" | "cli" | "zen" | "custom";
export type Difficulty = "normal" | "expert" | "master";
export type StopOnError = "off" | "word" | "letter";
export type ConfidenceMode = "off" | "on" | "max";
export type QuickRestart = "off" | "tab" | "esc" | "enter";
export type IndicateTypos = "off" | "below" | "replace";
export type CaretStyle = "off" | "default" | "block" | "outline" | "underline";
export type SmoothCaret = "off" | "slow" | "medium" | "fast";
export type PaceCaret = "off" | "average" | "pb" | "last" | "custom" | "daily";
export type TimerStyle = "off" | "bar" | "text" | "mini";
export type LiveStatStyle = "off" | "text" | "mini";
export type HighlightMode = "off" | "letter" | "word" | "next_word" | "next_two_words" | "next_three_words";
export type TypedEffect = "keep" | "fade" | "hide";
export type TypingSpeedUnit = "wpm" | "cpm" | "wps" | "cps" | "wph";
export type MinThreshold = "off" | "custom";
export type MinBurstThreshold = "off" | "fixed" | "flex";
export type RepeatQuotes = "off" | "typing";
export type ShowAverage = "off" | "speed" | "acc" | "both";
export type QuoteLength = 0 | 1 | 2 | 3; // short, medium, long, thicc
export type TapeMode = "off" | "letter" | "word";
export type TimerColor = "main" | "sub" | "text";
export type TimerOpacity = "0.25" | "0.5" | "0.75" | "1";
export type KeybindingMode = "normal" | "vim" | "emacs";

// ── Funbox ───────────────────────────────────────────────────────────

export type FunboxName =
  | "none"
  | "mirror"
  | "upside_down"
  | "rAnDoMcAsE"
  | "capitals"
  | "nospace"
  | "backwards"
  | "ddoouubblleedd"
  | "underscore_spaces"
  | "memory"
  | "read_ahead"
  | "read_ahead_easy"
  | "read_ahead_hard"
  | "no_quit"
  | "gibberish"
  | "specials"
  | "IPv4"
  | "IPv6"
  | "binary"
  | "hexadecimal"
  | "rot13"
  | "instant_messaging"
  | "zipf"
  | "pseudolang"
  | "poetry";

// ── Configuration ────────────────────────────────────────────────────

export interface GameConfig {
  // Core mode
  mode: GameMode;
  timeLimit: number;
  wordCount: number;
  quoteLength: QuoteLength[];
  language: string;

  // Content modifiers
  punctuation: boolean;
  numbers: boolean;

  // Behavior
  difficulty: Difficulty;
  quickRestart: QuickRestart;
  blindMode: boolean;
  lazyMode: boolean;
  freedomMode: boolean;
  confidenceMode: ConfidenceMode;
  stopOnError: StopOnError;
  strictSpace: boolean;
  quickEnd: boolean;
  indicateTypos: IndicateTypos;
  hideExtraLetters: boolean;

  // Fail conditions
  minWpm: MinThreshold;
  minWpmCustomSpeed: number;
  minAcc: MinThreshold;
  minAccCustom: number;
  minBurst: MinBurstThreshold;
  minBurstCustomSpeed: number;

  // Caret
  caretStyle: CaretStyle;
  smoothCaret: SmoothCaret;
  paceCaret: PaceCaret;
  paceCaretCustomSpeed: number;

  // Display
  timerStyle: TimerStyle;
  timerColor: TimerColor;
  timerOpacity: TimerOpacity;
  liveSpeedStyle: LiveStatStyle;
  liveAccStyle: LiveStatStyle;
  liveBurstStyle: LiveStatStyle;
  highlightMode: HighlightMode;
  typedEffect: TypedEffect;
  tapeMode: TapeMode;
  showAllLines: boolean;

  // Stats display
  typingSpeedUnit: TypingSpeedUnit;
  alwaysShowDecimalPlaces: boolean;
  startGraphsAtZero: boolean;

  // Theme
  theme: string;
  flipTestColors: boolean;
  colorfulMode: boolean;

  // UI toggles
  showKeyTips: boolean;
  capsLockWarning: boolean;
  repeatQuotes: RepeatQuotes;
  showAverage: ShowAverage;
  showPb: boolean;
  showOutOfFocusWarning: boolean;

  // Keybinding mode
  keybindingMode: KeybindingMode;

  // Funbox
  funbox: FunboxName[];

  // Custom text
  customText: CustomTextConfig | null;

  // Code snippets mode
  codeLanguage: string;

  // CLI commands mode
  cliCategory: string;
}

// ── Custom Text ──────────────────────────────────────────────────────

export interface CustomTextConfig {
  text: string[];
  mode: "repeat" | "shuffle";
  limit: { value: number; mode: "word" | "time" | "section" };
  pipeDelimiter: boolean;
}

// ── Quote ────────────────────────────────────────────────────────────

export interface Quote {
  id: number;
  text: string;
  source: string;
  length: number;
  group: number;
}

export interface QuoteCollection {
  language: string;
  groups: [number, number][];
  quotes: Quote[];
}

// ── Language ─────────────────────────────────────────────────────────

export interface LanguageWordList {
  name: string;
  orderedByFrequency: boolean;
  noLazyMode?: boolean;
  words: string[];
}

// ── Theme ────────────────────────────────────────────────────────────

export interface TerminalTheme {
  name: string;
  colors: {
    bg: string;
    main: string;
    caret: string;
    sub: string;
    subAlt: string;
    text: string;
    error: string;
    errorExtra: string;
    colorfulError: string;
    colorfulErrorExtra: string;
  };
}

// ── Word State ───────────────────────────────────────────────────────

export interface WordState {
  words: string[];
  activeWordIndex: number;
}

// ── Input State ──────────────────────────────────────────────────────

export interface InputState {
  current: string;
  history: string[];
  missedWords: Record<string, number>;
}

// ── Accuracy ─────────────────────────────────────────────────────────

export interface Accuracy {
  correct: number;
  incorrect: number;
}

// ── Live Metrics ─────────────────────────────────────────────────────

export interface MetricsLive {
  accuracy: Accuracy;
  keypressCountHistory: number[];
  wpmHistory: number[];
  rawHistory: number[];
  burstHistory: number[];
  currentBurstStart: number;
  afkHistory: boolean[];
  errorHistory: number[];
  keypressCount: number;
  errorCount: number;
  lastKeyTimestamp: number;
  wordTimings: number[];       // ms per word
  slowWords: string[];         // words typed slowly
  lastSecondKeypresses: number;
}

// ── Timing ───────────────────────────────────────────────────────────

export interface TimingState {
  startMs: number | null;
  endMs: number | null;
  elapsedSeconds: number;
}

// ── Character Counts ─────────────────────────────────────────────────

export interface CharCount {
  spaces: number;
  correctWordChars: number;
  allCorrectChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  correctSpaces: number;
}

// ── Full Game State ──────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  words: WordState;
  input: InputState;
  metrics: MetricsLive;
  timing: TimingState;
  failReason: string | null;
  quoteInfo: { source: string; id: number } | null;
  isRepeated: boolean;
  previousWords: string[] | null; // for repeat test
}

// ── Final Result ─────────────────────────────────────────────────────

export interface FinalResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  charStats: CharCount;
  testDuration: number;
  consistency: number;
  wpmHistory: number[];
  rawHistory: number[];
  burstHistory: number[];
  mode: GameMode;
  mode2: number | string; // timeLimit, wordCount, quoteLength, etc.
  language: string;
  punctuation: boolean;
  numbers: boolean;
  difficulty: Difficulty;
  lazyMode: boolean;
  blindMode: boolean;
  funbox: FunboxName[];
  quoteInfo: { source: string; id: number } | null;
  timestamp: number;
  isPb: boolean;
  missedWords?: Record<string, number>;
  charMistakes?: Record<string, number>; // "expected>typed" -> count
}

// ── Personal Best ────────────────────────────────────────────────────

export interface PersonalBest {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  timestamp: number;
  mode: GameMode;
  mode2: number | string;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  difficulty: Difficulty;
  lazyMode: boolean;
}

// ── Events ───────────────────────────────────────────────────────────

export type GameEvent =
  | { type: "INIT_TEST"; words: string[]; quoteInfo?: { source: string; id: number } }
  | { type: "START_TEST"; now: number }
  | { type: "INSERT_CHAR"; char: string; now: number }
  | { type: "DELETE_CHAR" }
  | { type: "DELETE_WORD" }
  | { type: "TICK"; now: number }
  | { type: "RESTART"; words: string[] }
  | { type: "FINISH" }
  | { type: "FAIL"; reason: string }
  | { type: "ADD_WORDS"; words: string[] }
  | { type: "SET_CONFIG"; config: Partial<GameConfig> };

// ── Commands ─────────────────────────────────────────────────────────

export type Command =
  | { type: "START_TIMER" }
  | { type: "STOP_TIMER" }
  | { type: "GENERATE_WORDS" };

// ── Reducer Result ───────────────────────────────────────────────────

export interface ReducerResult {
  state: GameState;
  commands: Command[];
}

// ── Persistence ──────────────────────────────────────────────────────

export interface StoredData {
  config: GameConfig;
  personalBests: PersonalBest[];
  results: FinalResult[];
}
