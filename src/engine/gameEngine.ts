import type {
  GameState,
  GameConfig,
  GameEvent,
  ReducerResult,
  Command,
  MetricsLive,
  InputState,
} from "./types.js";
import { countChars, calculateWpmAndRaw, calculateAccuracy, calculateBurst } from "./scoring.js";

// ── Helpers ─────────────────────────────────────────────────────────

function createMetrics(): MetricsLive {
  return {
    accuracy: { correct: 0, incorrect: 0 },
    keypressCountHistory: [],
    wpmHistory: [],
    rawHistory: [],
    burstHistory: [],
    currentBurstStart: 0,
    afkHistory: [],
    errorHistory: [],
    keypressCount: 0,
    errorCount: 0,
    lastKeyTimestamp: 0,
    wordTimings: [],
    slowWords: [],
    lastSecondKeypresses: 0,
  };
}

function createInput(): InputState {
  return {
    current: "",
    history: [],
    missedWords: {},
  };
}

export function createInitialState(
  config: GameConfig,
  words: string[],
  quoteInfo?: { source: string; id: number } | null,
): GameState {
  return {
    phase: "ready",
    config,
    words: { words, activeWordIndex: 0 },
    input: createInput(),
    metrics: createMetrics(),
    timing: { startMs: null, endMs: null, elapsedSeconds: 0 },
    failReason: null,
    quoteInfo: quoteInfo ?? null,
    isRepeated: false,
    previousWords: null,
  };
}

// ── Quick-end detection ─────────────────────────────────────────────

function shouldQuickEnd(state: GameState, input: string): boolean {
  if (!state.config.quickEnd) return false;
  const mode = state.config.mode;
  // Quick end applies to words, quote, and custom modes (not time, not zen)
  if (mode !== "words" && mode !== "quote" && mode !== "code" && mode !== "cli" && mode !== "custom") return false;
  const idx = state.words.activeWordIndex;
  if (idx < state.words.words.length - 1) return false;
  const target = state.words.words[idx]!;
  return input === target;
}

// ── Check whether the word had any errors ───────────────────────────

function wordHasError(typed: string, target: string, lazyMode: boolean): boolean {
  if (lazyMode) {
    // In lazy mode, errors are only counted if lengths differ
    return typed.length !== target.length;
  }
  if (typed.length !== target.length) return true;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== target[i]) return true;
  }
  return false;
}

// ── SLOW_WORD_THRESHOLD_MS ──────────────────────────────────────────
const SLOW_WORD_THRESHOLD_MS = 5000;

// ── Reducer ─────────────────────────────────────────────────────────

export function reduce(state: GameState, event: GameEvent): ReducerResult {
  const commands: Command[] = [];

  switch (event.type) {
    // ── INIT_TEST ───────────────────────────────────────────────────
    case "INIT_TEST": {
      const newState = createInitialState(
        state.config,
        event.words,
        event.quoteInfo ?? null,
      );
      return { state: newState, commands: [] };
    }

    // ── START_TEST ──────────────────────────────────────────────────
    case "START_TEST": {
      return {
        state: {
          ...state,
          phase: "active",
          timing: { ...state.timing, startMs: event.now },
          metrics: {
            ...state.metrics,
            currentBurstStart: event.now,
            lastKeyTimestamp: event.now,
          },
        },
        commands: [{ type: "START_TIMER" }],
      };
    }

    // ── INSERT_CHAR ─────────────────────────────────────────────────
    case "INSERT_CHAR": {
      if (state.phase !== "ready" && state.phase !== "active") {
        return { state, commands: [] };
      }

      // Auto-start on first keypress
      if (state.phase === "ready") {
        const startResult = reduce(state, { type: "START_TEST", now: event.now });
        state = startResult.state;
        commands.push(...startResult.commands);
      }

      const isZen = state.config.mode === "zen";

      // In zen mode, the target is whatever the user types.
      // We grow the words array on the fly.
      if (isZen) {
        return handleZenInsert(state, event.char, event.now, commands);
      }

      const target = state.words.words[state.words.activeWordIndex];
      if (!target) return { state, commands };

      // ── Space handling ────────────────────────────────────────────
      if (event.char === " ") {
        return handleSpace(state, target, event.now, commands);
      }

      // ── Regular character ─────────────────────────────────────────
      return handleChar(state, target, event.char, event.now, commands);
    }

    // ── DELETE_CHAR ─────────────────────────────────────────────────
    case "DELETE_CHAR": {
      if (state.phase !== "active") return { state, commands: [] };

      // Confidence mode "max" = no backspace at all
      if (state.config.confidenceMode === "max") {
        // Freedom mode overrides: allow backspace even when stopOnError is on
        if (!state.config.freedomMode) {
          return { state, commands: [] };
        }
      }

      // Confidence mode "on" = backspace only deletes the whole word (handled by DELETE_WORD)
      // So single char delete is blocked
      if (state.config.confidenceMode === "on") {
        if (!state.config.freedomMode) {
          return { state, commands: [] };
        }
      }

      // stopOnError "word" prevents going back to previous words
      // but backspace within the current word is still allowed
      // Freedom mode overrides stopOnError backspace restrictions
      const canGoBack = state.config.freedomMode || state.config.stopOnError === "off";

      if (state.input.current.length > 0) {
        return {
          state: {
            ...state,
            input: { ...state.input, current: state.input.current.slice(0, -1) },
          },
          commands: [],
        };
      }

      // If current is empty, go to previous word (if allowed)
      if (canGoBack && state.words.activeWordIndex > 0) {
        const prevIndex = state.words.activeWordIndex - 1;
        const prevInput = state.input.history[prevIndex] ?? "";
        const newHistory = state.input.history.slice(0, -1);
        return {
          state: {
            ...state,
            input: { ...state.input, current: prevInput, history: newHistory },
            words: { ...state.words, activeWordIndex: prevIndex },
          },
          commands: [],
        };
      }

      return { state, commands: [] };
    }

    // ── DELETE_WORD ─────────────────────────────────────────────────
    case "DELETE_WORD": {
      if (state.phase !== "active") return { state, commands: [] };

      // Confidence mode "max" = no backspace at all
      if (state.config.confidenceMode === "max") {
        if (!state.config.freedomMode) {
          return { state, commands: [] };
        }
      }

      const canGoBackWord = state.config.freedomMode || state.config.stopOnError === "off";

      if (state.input.current.length > 0) {
        return {
          state: {
            ...state,
            input: { ...state.input, current: "" },
          },
          commands: [],
        };
      }

      // If already empty, go to previous word (if allowed)
      if (canGoBackWord && state.words.activeWordIndex > 0) {
        const prevIndex = state.words.activeWordIndex - 1;
        const prevInput = state.input.history[prevIndex] ?? "";
        const newHistory = state.input.history.slice(0, -1);
        return {
          state: {
            ...state,
            input: { ...state.input, current: prevInput, history: newHistory },
            words: { ...state.words, activeWordIndex: prevIndex },
          },
          commands: [],
        };
      }

      return { state, commands: [] };
    }

    // ── TICK ────────────────────────────────────────────────────────
    case "TICK": {
      if (state.phase !== "active") return { state, commands: [] };

      const elapsed = state.timing.elapsedSeconds + 1;
      const isTimeMode = state.config.mode === "time";

      const charCount = countChars(
        state.input.history,
        state.input.current,
        state.words.words,
        state.words.activeWordIndex,
        false,
        isTimeMode,
      );
      const { wpm, raw } = calculateWpmAndRaw(charCount, elapsed);
      const acc = calculateAccuracy(
        state.metrics.accuracy.correct,
        state.metrics.accuracy.incorrect,
      );

      // Calculate burst for the current second
      const currentBurst = raw; // raw WPM for this second is a reasonable proxy

      const newState: GameState = {
        ...state,
        timing: { ...state.timing, elapsedSeconds: elapsed },
        metrics: {
          ...state.metrics,
          wpmHistory: [...state.metrics.wpmHistory, wpm],
          rawHistory: [...state.metrics.rawHistory, raw],
          burstHistory: [...state.metrics.burstHistory, currentBurst],
          keypressCountHistory: [...state.metrics.keypressCountHistory, state.metrics.keypressCount],
          errorHistory: [...state.metrics.errorHistory, state.metrics.errorCount],
          afkHistory: [...state.metrics.afkHistory, state.metrics.lastSecondKeypresses === 0],
          lastSecondKeypresses: 0, // reset for next second
        },
      };

      // ── Time mode: check if time is up ────────────────────────────
      if (isTimeMode && elapsed >= state.config.timeLimit) {
        return {
          state: {
            ...newState,
            phase: "finished",
            timing: { ...newState.timing, endMs: event.now },
          },
          commands: [{ type: "STOP_TIMER" }],
        };
      }

      // ── Difficulty-based fail conditions ──────────────────────────
      // Expert difficulty: fail if accuracy < 95%
      if (state.config.difficulty === "expert" && elapsed >= 5 && acc < 95) {
        return {
          state: {
            ...newState,
            phase: "failed",
            failReason: "Accuracy below 95%",
            timing: { ...newState.timing, endMs: event.now },
          },
          commands: [{ type: "STOP_TIMER" }],
        };
      }

      // Master difficulty: fail if any errors
      if (state.config.difficulty === "master" && state.metrics.accuracy.incorrect > 0) {
        return {
          state: {
            ...newState,
            phase: "failed",
            failReason: "Made an error in master mode",
            timing: { ...newState.timing, endMs: event.now },
          },
          commands: [{ type: "STOP_TIMER" }],
        };
      }

      // ── Min WPM fail condition ────────────────────────────────────
      if (state.config.minWpm === "custom" && elapsed >= 5) {
        if (wpm < state.config.minWpmCustomSpeed) {
          return {
            state: {
              ...newState,
              phase: "failed",
              failReason: `WPM below minimum (${state.config.minWpmCustomSpeed})`,
              timing: { ...newState.timing, endMs: event.now },
            },
            commands: [{ type: "STOP_TIMER" }],
          };
        }
      }

      // ── Min accuracy fail condition ───────────────────────────────
      if (state.config.minAcc === "custom" && elapsed >= 5) {
        if (acc < state.config.minAccCustom) {
          return {
            state: {
              ...newState,
              phase: "failed",
              failReason: `Accuracy below minimum (${state.config.minAccCustom}%)`,
              timing: { ...newState.timing, endMs: event.now },
            },
            commands: [{ type: "STOP_TIMER" }],
          };
        }
      }

      // ── Min burst fail condition ──────────────────────────────────
      if (state.config.minBurst !== "off" && state.metrics.burstHistory.length > 0) {
        const lastBurst = state.metrics.burstHistory[state.metrics.burstHistory.length - 1]!;
        if (state.config.minBurst === "fixed") {
          if (lastBurst < state.config.minBurstCustomSpeed) {
            return {
              state: {
                ...newState,
                phase: "failed",
                failReason: `Burst below minimum (${state.config.minBurstCustomSpeed})`,
                timing: { ...newState.timing, endMs: event.now },
              },
              commands: [{ type: "STOP_TIMER" }],
            };
          }
        } else if (state.config.minBurst === "flex") {
          // Flex: the threshold is the average of all bursts so far
          const avgBurst =
            state.metrics.burstHistory.reduce((a, b) => a + b, 0) /
            state.metrics.burstHistory.length;
          if (lastBurst < avgBurst * 0.75) {
            return {
              state: {
                ...newState,
                phase: "failed",
                failReason: "Burst below flexible minimum",
                timing: { ...newState.timing, endMs: event.now },
              },
              commands: [{ type: "STOP_TIMER" }],
            };
          }
        }
      }

      return { state: newState, commands: [] };
    }

    // ── FINISH ──────────────────────────────────────────────────────
    case "FINISH": {
      if (state.phase !== "active") return { state, commands: [] };
      return {
        state: {
          ...state,
          phase: "finished",
          timing: { ...state.timing, endMs: performance.now() },
        },
        commands: [{ type: "STOP_TIMER" }],
      };
    }

    // ── FAIL ────────────────────────────────────────────────────────
    case "FAIL": {
      return {
        state: {
          ...state,
          phase: "failed",
          failReason: event.reason,
          timing: { ...state.timing, endMs: performance.now() },
        },
        commands: [{ type: "STOP_TIMER" }],
      };
    }

    // ── RESTART ─────────────────────────────────────────────────────
    case "RESTART": {
      const newState = createInitialState(state.config, event.words);
      // Carry forward previous words for repeat functionality
      newState.previousWords = state.words.words;
      return { state: newState, commands: [{ type: "STOP_TIMER" }] };
    }

    // ── ADD_WORDS ───────────────────────────────────────────────────
    case "ADD_WORDS": {
      return {
        state: {
          ...state,
          words: {
            ...state.words,
            words: [...state.words.words, ...event.words],
          },
        },
        commands: [],
      };
    }

    // ── SET_CONFIG ──────────────────────────────────────────────────
    case "SET_CONFIG": {
      return {
        state: {
          ...state,
          config: { ...state.config, ...event.config },
        },
        commands: [],
      };
    }

    default:
      return { state, commands: [] };
  }
}

// ── Space handling ──────────────────────────────────────────────────

function handleSpace(
  state: GameState,
  target: string,
  now: number,
  commands: Command[],
): ReducerResult {
  const { config, input, words, metrics } = state;

  // Strict space: prevent space if input is empty
  if (config.strictSpace && input.current.length === 0) {
    return { state, commands };
  }

  // Don't allow space if input is empty (standard behavior)
  if (input.current.length === 0) {
    return { state, commands };
  }

  // stopOnError "word": don't allow advancing if current word has errors
  if (config.stopOnError === "word") {
    const hasErr = wordHasError(input.current, target, config.lazyMode);
    if (hasErr) {
      return { state, commands };
    }
  }

  // ── Calculate burst for completed word ────────────────────────────
  const burstMs = now - metrics.currentBurstStart;
  const burst = calculateBurst(input.current.length, burstMs);

  // ── Word timing ───────────────────────────────────────────────────
  const wordTimeMs = now - metrics.currentBurstStart;
  const newWordTimings = [...metrics.wordTimings, wordTimeMs];
  const newSlowWords = [...metrics.slowWords];
  if (wordTimeMs > SLOW_WORD_THRESHOLD_MS) {
    newSlowWords.push(target);
  }

  // ── Track missed words ────────────────────────────────────────────
  const newMissedWords = { ...input.missedWords };
  const hasError = wordHasError(input.current, target, config.lazyMode);
  if (hasError) {
    newMissedWords[target] = (newMissedWords[target] ?? 0) + 1;
  }

  const newHistory = [...input.history, input.current];
  const newIndex = words.activeWordIndex + 1;

  // ── Check if we need more words for time mode ─────────────────────
  if (config.mode === "time" && newIndex >= words.words.length - 10) {
    commands.push({ type: "GENERATE_WORDS" });
  }

  // ── Accuracy for the space keypress ───────────────────────────────
  const spaceCorrect = !hasError;
  const newAccuracy = {
    correct: metrics.accuracy.correct + (spaceCorrect ? 1 : 0),
    incorrect: metrics.accuracy.incorrect + (spaceCorrect ? 0 : 1),
  };

  // ── Check completion for words/quote/custom modes ─────────────────
  const isFinishingMode =
    config.mode === "words" || config.mode === "quote" || config.mode === "code" || config.mode === "cli" || config.mode === "custom";
  if (isFinishingMode && newIndex >= words.words.length) {
    return {
      state: {
        ...state,
        phase: "finished",
        input: {
          current: "",
          history: newHistory,
          missedWords: newMissedWords,
        },
        words: { ...words, activeWordIndex: newIndex },
        metrics: {
          ...metrics,
          burstHistory: [...metrics.burstHistory, burst],
          currentBurstStart: now,
          accuracy: newAccuracy,
          wordTimings: newWordTimings,
          slowWords: newSlowWords,
        },
        timing: { ...state.timing, endMs: now },
      },
      commands: [...commands, { type: "STOP_TIMER" }],
    };
  }

  return {
    state: {
      ...state,
      input: {
        current: "",
        history: newHistory,
        missedWords: newMissedWords,
      },
      words: { ...words, activeWordIndex: newIndex },
      metrics: {
        ...metrics,
        burstHistory: [...metrics.burstHistory, burst],
        currentBurstStart: now,
        keypressCount: metrics.keypressCount + 1,
        accuracy: newAccuracy,
        wordTimings: newWordTimings,
        slowWords: newSlowWords,
        lastKeyTimestamp: now,
        lastSecondKeypresses: metrics.lastSecondKeypresses + 1,
      },
    },
    commands,
  };
}

// ── Character handling ──────────────────────────────────────────────

function handleChar(
  state: GameState,
  target: string,
  char: string,
  now: number,
  commands: Command[],
): ReducerResult {
  const { config, input, metrics } = state;
  const charIndex = input.current.length;

  // Determine correctness
  let isCorrect: boolean;
  if (config.lazyMode) {
    // Lazy mode: any character is accepted while typing; errors only checked at word boundary
    isCorrect = true;
  } else {
    isCorrect = charIndex < target.length && char === target[charIndex];
  }

  // stopOnError="letter": reject incorrect chars (unless freedom mode)
  if (config.stopOnError === "letter" && !isCorrect) {
    if (!config.freedomMode) {
      return { state, commands };
    }
    // Freedom mode: allow the incorrect char but still mark it incorrect
  }

  const newInput = input.current + char;
  const newAccuracy = {
    correct: metrics.accuracy.correct + (isCorrect ? 1 : 0),
    incorrect: metrics.accuracy.incorrect + (isCorrect ? 0 : 1),
  };
  const newErrorCount = metrics.errorCount + (isCorrect ? 0 : 1);

  // Check quickEnd
  if (shouldQuickEnd({ ...state, input: { ...input, current: newInput } }, newInput)) {
    const newHistory = [...input.history, newInput];
    return {
      state: {
        ...state,
        phase: "finished",
        input: {
          current: newInput,
          history: newHistory,
          missedWords: input.missedWords,
        },
        metrics: {
          ...metrics,
          accuracy: newAccuracy,
          keypressCount: metrics.keypressCount + 1,
          errorCount: newErrorCount,
          lastKeyTimestamp: now,
          lastSecondKeypresses: metrics.lastSecondKeypresses + 1,
        },
        timing: { ...state.timing, endMs: now },
      },
      commands: [...commands, { type: "STOP_TIMER" }],
    };
  }

  return {
    state: {
      ...state,
      input: { ...input, current: newInput },
      metrics: {
        ...metrics,
        accuracy: newAccuracy,
        keypressCount: metrics.keypressCount + 1,
        errorCount: newErrorCount,
        lastKeyTimestamp: now,
        lastSecondKeypresses: metrics.lastSecondKeypresses + 1,
      },
    },
    commands,
  };
}

// ── Zen mode insert handling ────────────────────────────────────────

function handleZenInsert(
  state: GameState,
  char: string,
  now: number,
  commands: Command[],
): ReducerResult {
  const { input, words, metrics } = state;

  if (char === " ") {
    // In zen mode, the typed word becomes the target word
    if (input.current.length === 0) return { state, commands };

    const typedWord = input.current;
    const newWords = [...words.words];
    // If the current word index doesn't have a word yet, add it
    if (words.activeWordIndex >= newWords.length) {
      newWords.push(typedWord);
    } else {
      newWords[words.activeWordIndex] = typedWord;
    }

    const burstMs = now - metrics.currentBurstStart;
    const burst = calculateBurst(input.current.length, burstMs);

    const wordTimeMs = now - metrics.currentBurstStart;
    const newWordTimings = [...metrics.wordTimings, wordTimeMs];

    const newHistory = [...input.history, input.current];
    const newIndex = words.activeWordIndex + 1;
    // Ensure there's a slot for the next word
    if (newIndex >= newWords.length) {
      newWords.push("");
    }

    return {
      state: {
        ...state,
        input: {
          current: "",
          history: newHistory,
          missedWords: input.missedWords,
        },
        words: { words: newWords, activeWordIndex: newIndex },
        metrics: {
          ...metrics,
          burstHistory: [...metrics.burstHistory, burst],
          currentBurstStart: now,
          keypressCount: metrics.keypressCount + 1,
          accuracy: {
            correct: metrics.accuracy.correct + 1,
            incorrect: metrics.accuracy.incorrect,
          },
          wordTimings: newWordTimings,
          lastKeyTimestamp: now,
          lastSecondKeypresses: metrics.lastSecondKeypresses + 1,
        },
      },
      commands,
    };
  }

  // Regular character in zen mode: always correct
  const newInput = input.current + char;

  // Update the current target word to match what the user is typing
  const newWords = [...words.words];
  if (words.activeWordIndex >= newWords.length) {
    newWords.push(newInput);
  } else {
    newWords[words.activeWordIndex] = newInput;
  }

  return {
    state: {
      ...state,
      input: { ...input, current: newInput },
      words: { words: newWords, activeWordIndex: words.activeWordIndex },
      metrics: {
        ...metrics,
        accuracy: {
          correct: metrics.accuracy.correct + 1,
          incorrect: metrics.accuracy.incorrect,
        },
        keypressCount: metrics.keypressCount + 1,
        errorCount: metrics.errorCount,
        lastKeyTimestamp: now,
        lastSecondKeypresses: metrics.lastSecondKeypresses + 1,
      },
    },
    commands,
  };
}
