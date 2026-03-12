import type {
  CharCount,
  FinalResult,
  GameState,
  TypingSpeedUnit,
} from "./types.js";

// ── Character counting ──────────────────────────────────────────────

export function countChars(
  inputHistory: string[],
  currentInput: string,
  targetWords: string[],
  activeWordIndex: number,
  isFinal: boolean,
  isTimeMode: boolean,
): CharCount {
  const result: CharCount = {
    spaces: 0,
    correctWordChars: 0,
    allCorrectChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,
    correctSpaces: 0,
  };

  const lastIndex = isFinal ? activeWordIndex : activeWordIndex - 1;

  for (let i = 0; i <= lastIndex; i++) {
    const target = targetWords[i];
    if (!target) continue;

    const input =
      i < inputHistory.length
        ? inputHistory[i]!
        : i === activeWordIndex
          ? currentInput
          : "";

    if (i > 0) {
      result.spaces++;
      if (i <= inputHistory.length) {
        result.correctSpaces++;
      }
    }

    let wordCorrectChars = 0;
    let wordAllCorrect = 0;
    let wordIncorrect = 0;

    const minLen = Math.min(input.length, target.length);
    for (let c = 0; c < minLen; c++) {
      if (input[c] === target[c]) {
        wordCorrectChars++;
        wordAllCorrect++;
      } else {
        wordIncorrect++;
      }
    }

    if (input.length > target.length) {
      result.extraChars += input.length - target.length;
    } else if (input.length < target.length) {
      // For time mode last word, give partial credit
      if (isFinal && i === activeWordIndex && isTimeMode) {
        // only count typed chars, not missed
      } else {
        result.missedChars += target.length - input.length;
      }
    }

    // A word is "correct" only if every char matches and lengths are equal
    if (wordCorrectChars === target.length && input.length === target.length) {
      result.correctWordChars += wordCorrectChars;
    }
    result.allCorrectChars += wordAllCorrect;
    result.incorrectChars += wordIncorrect;
  }

  return result;
}

// ── WPM & Raw calculation ───────────────────────────────────────────

export function calculateWpmAndRaw(
  charCount: CharCount,
  testSeconds: number,
): { wpm: number; raw: number } {
  if (testSeconds <= 0) return { wpm: 0, raw: 0 };
  const wpm =
    ((charCount.correctWordChars + charCount.correctSpaces) * (60 / testSeconds)) / 5;
  const raw =
    ((charCount.allCorrectChars +
      charCount.spaces +
      charCount.incorrectChars +
      charCount.extraChars) *
      (60 / testSeconds)) /
    5;
  return { wpm: Math.max(0, wpm), raw: Math.max(0, raw) };
}

// ── Accuracy ────────────────────────────────────────────────────────

export function calculateAccuracy(correct: number, incorrect: number): number {
  const total = correct + incorrect;
  if (total === 0) return 100;
  return (correct / total) * 100;
}

// ── Burst ───────────────────────────────────────────────────────────

export function calculateBurst(wordLength: number, timeToWriteMs: number): number {
  if (timeToWriteMs <= 0) return 0;
  return (wordLength * 60) / (timeToWriteMs / 1000) / 5;
}

// ── Consistency ─────────────────────────────────────────────────────

export function calculateConsistency(rawPerSecond: number[]): number {
  if (rawPerSecond.length < 2) return 100;
  const filtered = rawPerSecond.filter((v) => v > 0);
  if (filtered.length < 2) return 100;

  const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
  if (mean === 0) return 0;
  const variance =
    filtered.reduce((sum, v) => sum + (v - mean) ** 2, 0) / filtered.length;
  const stddev = Math.sqrt(variance);
  const cv = stddev / mean;

  // Kogasa formula: consistency = 100 * (1 - cv)
  return Math.max(0, Math.min(100, 100 * (1 - cv)));
}

// ── Speed unit conversion ───────────────────────────────────────────

/**
 * Convert a WPM value to another typing speed unit.
 *  - wpm: words per minute (5 chars = 1 word)
 *  - cpm: characters per minute (wpm * 5)
 *  - wps: words per second (wpm / 60)
 *  - cps: characters per second (wpm * 5 / 60)
 *  - wph: words per hour (wpm * 60)
 */
export function convertSpeed(wpm: number, unit: TypingSpeedUnit): number {
  switch (unit) {
    case "wpm":
      return wpm;
    case "cpm":
      return wpm * 5;
    case "wps":
      return wpm / 60;
    case "cps":
      return (wpm * 5) / 60;
    case "wph":
      return wpm * 60;
    default:
      return wpm;
  }
}

// ── Mode2 helper ────────────────────────────────────────────────────

function getMode2(state: GameState): number | string {
  switch (state.config.mode) {
    case "time":
      return state.config.timeLimit;
    case "words":
      return state.config.wordCount;
    case "quote":
      return state.quoteInfo?.id ?? 0;
    case "zen":
      return 0;
    case "custom":
      return "custom";
    default:
      return 0;
  }
}

// ── Final Result ────────────────────────────────────────────────────

export function calculateFinalResult(state: GameState): FinalResult {
  const elapsed = state.timing.elapsedSeconds || 1;
  const isTimeMode = state.config.mode === "time";

  const charStats = countChars(
    state.input.history,
    state.input.current,
    state.words.words,
    state.words.activeWordIndex,
    true,
    isTimeMode,
  );

  const { wpm, raw } = calculateWpmAndRaw(charStats, elapsed);
  const accuracy = calculateAccuracy(
    state.metrics.accuracy.correct,
    state.metrics.accuracy.incorrect,
  );
  const consistency = calculateConsistency(state.metrics.rawHistory);

  return {
    wpm,
    rawWpm: raw,
    accuracy,
    charStats,
    testDuration: elapsed,
    consistency,
    wpmHistory: [...state.metrics.wpmHistory],
    rawHistory: [...state.metrics.rawHistory],
    burstHistory: [...state.metrics.burstHistory],
    mode: state.config.mode,
    mode2: getMode2(state),
    language: state.config.language,
    punctuation: state.config.punctuation,
    numbers: state.config.numbers,
    difficulty: state.config.difficulty,
    lazyMode: state.config.lazyMode,
    blindMode: state.config.blindMode,
    funbox: [...state.config.funbox],
    quoteInfo: state.quoteInfo,
    timestamp: Date.now(),
    isPb: false, // Caller should compare against personal bests and set this
  };
}
