import type { GameConfig, GameMode, Difficulty, QuoteLength } from "../engine/types.js";
import { DEFAULT_CONFIG } from "../config/difficulty.js";

export function parseArgs(argv: string[]): GameConfig | null {
  let mode: GameMode | null = null;
  let timeLimit: number | null = null;
  let wordCount: number | null = null;
  let language: string | null = null;
  let punctuation: boolean | null = null;
  let numbers: boolean | null = null;
  let difficulty: Difficulty | null = null;
  let theme: string | null = null;
  let quoteLength: QuoteLength | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if ((arg === "--mode" || arg === "-m") && next) {
      if (
        next === "time" ||
        next === "words" ||
        next === "quote" ||
        next === "zen" ||
        next === "custom"
      ) {
        mode = next;
      }
      i++;
    } else if ((arg === "--time" || arg === "-t") && next) {
      const parsed = parseInt(next, 10);
      if (!isNaN(parsed)) timeLimit = parsed;
      i++;
    } else if ((arg === "--words" || arg === "-w") && next) {
      const parsed = parseInt(next, 10);
      if (!isNaN(parsed)) wordCount = parsed;
      i++;
    } else if ((arg === "--language" || arg === "-l") && next) {
      language = next;
      i++;
    } else if (arg === "--punctuation") {
      punctuation = true;
    } else if (arg === "--no-punctuation") {
      punctuation = false;
    } else if (arg === "--numbers") {
      numbers = true;
    } else if (arg === "--no-numbers") {
      numbers = false;
    } else if (arg === "--difficulty" && next) {
      if (next === "normal" || next === "expert" || next === "master") {
        difficulty = next;
      }
      i++;
    } else if (arg === "--theme" && next) {
      theme = next;
      i++;
    } else if (arg === "--quote-length" && next) {
      const parsed = parseInt(next, 10);
      if (parsed >= 0 && parsed <= 3) {
        quoteLength = parsed as QuoteLength;
      }
      i++;
    }
  }

  // If no args provided, return null to show menu
  if (
    mode === null &&
    timeLimit === null &&
    wordCount === null &&
    language === null &&
    punctuation === null &&
    numbers === null &&
    difficulty === null &&
    theme === null &&
    quoteLength === null
  ) {
    return null;
  }

  // Infer mode from flags
  if (mode === null) {
    if (wordCount !== null) mode = "words";
    else if (quoteLength !== null) mode = "quote";
    else mode = "time";
  }

  return {
    ...DEFAULT_CONFIG,
    mode,
    timeLimit: timeLimit ?? DEFAULT_CONFIG.timeLimit,
    wordCount: wordCount ?? DEFAULT_CONFIG.wordCount,
    language: language ?? DEFAULT_CONFIG.language,
    punctuation: punctuation ?? DEFAULT_CONFIG.punctuation,
    numbers: numbers ?? DEFAULT_CONFIG.numbers,
    difficulty: difficulty ?? DEFAULT_CONFIG.difficulty,
    theme: theme ?? DEFAULT_CONFIG.theme,
    quoteLength: quoteLength !== null ? [quoteLength] : DEFAULT_CONFIG.quoteLength,
  };
}
