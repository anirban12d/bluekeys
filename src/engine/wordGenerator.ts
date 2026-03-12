import type { GameConfig, FunboxName } from "./types.js";
import { applyFunboxTransform, generateFunboxWord, getFunbox } from "../constants/funbox/index.js";

// ── Utilities ───────────────────────────────────────────────────────

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function getNextWord(wordList: string[], previousWord: string | null): string {
  let word: string;
  do {
    word = randomElement(wordList);
  } while (word === previousWord && wordList.length > 1);
  return word;
}

function applyPunctuation(word: string, index: number, isAfterPeriod: boolean): string {
  if (index === 0 || isAfterPeriod) {
    word = word.charAt(0).toUpperCase() + word.slice(1);
  }
  const roll = Math.random();
  if (roll < 0.05) return word + ".";
  if (roll < 0.10) return word + ",";
  if (roll < 0.12) return word + "!";
  if (roll < 0.14) return word + "?";
  return word;
}

function applyNumbers(words: string[]): string[] {
  return words.map((w) =>
    Math.random() < 0.1 ? String(Math.floor(Math.random() * 1000)) : w,
  );
}

// ── Check if any active funbox generates its own words ──────────────

function hasFunboxWordGenerator(funboxNames: FunboxName[]): FunboxName | null {
  for (const name of funboxNames) {
    if (name === "none") continue;
    const fb = getFunbox(name);
    if (fb?.generatesOwnWords) return name;
  }
  return null;
}

// ── Generate words for funbox modes ─────────────────────────────────

function generateFunboxWords(funboxName: FunboxName, count: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(generateFunboxWord(funboxName));
  }
  return words;
}

// ── Quote mode: split quote text into words ─────────────────────────

export function generateQuoteWords(quoteText: string): string[] {
  return quoteText.split(/\s+/).filter((w) => w.length > 0);
}

// ── Custom mode: use custom text config ─────────────────────────────

export function generateCustomWords(config: GameConfig): string[] {
  const customText = config.customText;
  if (!customText || customText.text.length === 0) {
    return ["no", "custom", "text", "configured"];
  }

  let sourceWords = [...customText.text];

  // Shuffle if configured
  if (customText.mode === "shuffle") {
    for (let i = sourceWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sourceWords[i], sourceWords[j]] = [sourceWords[j]!, sourceWords[i]!];
    }
  }

  // Apply limit
  const limit = customText.limit;
  if (limit.mode === "word" && limit.value > 0) {
    // Repeat source words to fill up to limit
    const result: string[] = [];
    while (result.length < limit.value) {
      for (const word of sourceWords) {
        result.push(word);
        if (result.length >= limit.value) break;
      }
    }
    return result;
  }

  if (limit.mode === "section" && limit.value > 0) {
    // Sections are delimited by pipe if pipeDelimiter is true
    // Otherwise, just return all words
    return sourceWords.slice(0, limit.value);
  }

  // For time mode limit or no limit, return a reasonable amount
  // (time mode will request more as needed via ADD_WORDS)
  if (limit.mode === "time") {
    // Return enough words for the test; more will be requested
    const result: string[] = [];
    const targetCount = 100;
    while (result.length < targetCount) {
      for (const word of sourceWords) {
        result.push(word);
        if (result.length >= targetCount) break;
      }
    }
    return result;
  }

  // Default: return all source words, repeating if in repeat mode
  if (customText.mode === "repeat") {
    const result: string[] = [];
    const targetCount = Math.max(sourceWords.length, 50);
    while (result.length < targetCount) {
      for (const word of sourceWords) {
        result.push(word);
        if (result.length >= targetCount) break;
      }
    }
    return result;
  }

  return sourceWords;
}

// ── Zen mode: empty initial words ───────────────────────────────────

export function generateZenWords(): string[] {
  // Zen mode starts with an empty word that the user fills in
  return [""];
}

// ── Main word generation ────────────────────────────────────────────

export function generateWords(config: GameConfig, wordList: string[]): string[] {
  // ── Zen mode ──────────────────────────────────────────────────────
  if (config.mode === "zen") {
    return generateZenWords();
  }

  // ── Quote mode ────────────────────────────────────────────────────
  // Quote mode words are set externally via INIT_TEST with the quote text.
  // This function provides a fallback.
  if (config.mode === "quote") {
    // Words for quote mode should be passed in via INIT_TEST.
    // Return placeholder words if called directly.
    return ["loading", "quote..."];
  }

  // ── Custom mode ───────────────────────────────────────────────────
  if (config.mode === "custom") {
    const customWords = generateCustomWords(config);
    // Apply funbox transforms to custom words
    if (config.funbox.length > 0 && !config.funbox.every((f) => f === "none")) {
      return customWords.map((w) => applyFunboxTransform(w, config.funbox));
    }
    return customWords;
  }

  // ── Check for funbox word generators ──────────────────────────────
  const funboxGenerator = hasFunboxWordGenerator(config.funbox);
  if (funboxGenerator) {
    const count = config.mode === "words" ? config.wordCount : 100;
    return generateFunboxWords(funboxGenerator, count);
  }

  // ── Standard word/time mode ───────────────────────────────────────
  const count = config.mode === "words" ? config.wordCount : 100;
  const words: string[] = [];
  let afterPeriod = true;

  for (let i = 0; i < count; i++) {
    let word = getNextWord(wordList, words[i - 1] ?? null);

    // Apply funbox transforms
    if (config.funbox.length > 0 && !config.funbox.every((f) => f === "none")) {
      word = applyFunboxTransform(word, config.funbox);
    }

    if (config.punctuation) {
      word = applyPunctuation(word, i, afterPeriod);
      afterPeriod =
        word.endsWith(".") || word.endsWith("!") || word.endsWith("?");
    }
    words.push(word);
  }

  if (config.numbers) {
    return applyNumbers(words);
  }
  return words;
}

// ── Generate more words (for time mode rolling buffer) ──────────────

export function generateMoreWords(
  wordList: string[],
  existing: string[],
  count: number,
  config?: GameConfig,
): string[] {
  // If a funbox generates its own words, use that
  if (config) {
    const funboxGenerator = hasFunboxWordGenerator(config.funbox);
    if (funboxGenerator) {
      return generateFunboxWords(funboxGenerator, count);
    }

    // Custom mode: generate more from custom text
    if (config.mode === "custom" && config.customText) {
      const sourceWords = config.customText.text;
      if (sourceWords.length > 0) {
        const result: string[] = [];
        let idx = 0;
        for (let i = 0; i < count; i++) {
          result.push(sourceWords[idx % sourceWords.length]!);
          idx++;
        }
        if (config.funbox.length > 0 && !config.funbox.every((f) => f === "none")) {
          return result.map((w) => applyFunboxTransform(w, config.funbox));
        }
        return result;
      }
    }
  }

  const newWords: string[] = [];
  let prev = existing[existing.length - 1] ?? null;
  for (let i = 0; i < count; i++) {
    let word = getNextWord(wordList, prev);

    // Apply funbox transforms
    if (config && config.funbox.length > 0 && !config.funbox.every((f) => f === "none")) {
      word = applyFunboxTransform(word, config.funbox);
    }

    // Apply punctuation if configured
    if (config?.punctuation) {
      const isAfterPeriod =
        prev != null &&
        (prev.endsWith(".") || prev.endsWith("!") || prev.endsWith("?"));
      word = applyPunctuation(word, i, i === 0 ? true : isAfterPeriod);
    }

    newWords.push(word);
    prev = word;
  }

  if (config?.numbers) {
    return applyNumbers(newWords);
  }

  return newWords;
}
