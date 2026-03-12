import { useRef, useSyncExternalStore, useCallback, useEffect } from "react";
import type { GameConfig, GameEvent, Command } from "../../engine/types.js";
import { createInitialState } from "../../engine/gameEngine.js";
import { createStore, type Store } from "../../state/store.js";
import { createTimer, type GameTimer } from "../../engine/timer.js";
import { generateWords, generateMoreWords } from "../../engine/wordGenerator.js";
import { loadLanguage } from "../../constants/languages/index.js";
import { getRandomQuote } from "../../constants/quotes/index.js";
import { getRandomSnippet } from "../../constants/snippets/index.js";
import { getRandomCommand } from "../../constants/commands/index.js";
import { generateFunboxWord, applyFunboxTransform } from "../../constants/funbox/index.js";
import wordList from "../../constants/languages/words.json" with { type: "json" };

function getWordListForConfig(config: GameConfig): string[] {
  const lang = loadLanguage(config.language);
  const list = lang.words.length > 0 ? lang.words : (wordList as string[]);
  return list;
}

function hasFunboxThatGeneratesWords(config: GameConfig): boolean {
  return config.funbox.some((name) => {
    return [
      "gibberish", "specials", "IPv4", "IPv6",
      "binary", "hexadecimal", "pseudolang", "poetry", "wikipedia",
    ].includes(name);
  });
}

function generateFunboxWords(config: GameConfig, count: number): string[] {
  const generatingFunbox = config.funbox.find((name) =>
    ["gibberish", "specials", "IPv4", "IPv6", "binary", "hexadecimal", "pseudolang"].includes(name),
  );
  if (!generatingFunbox) return [];

  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(generateFunboxWord(generatingFunbox));
  }
  return words;
}

function buildInitialWords(config: GameConfig): { words: string[]; quoteInfo: { source: string; id: number } | null } {
  // Zen mode: no initial words
  if (config.mode === "zen") {
    return { words: [], quoteInfo: null };
  }

  // Quote mode: load a quote and split into words
  if (config.mode === "quote") {
    const quote = getRandomQuote(config.language, config.quoteLength);
    if (quote) {
      const words = quote.text.split(/\s+/).filter((w) => w.length > 0);
      return {
        words: words.map((w) => applyFunboxTransform(w, config.funbox)),
        quoteInfo: { source: quote.source, id: quote.id },
      };
    }
    // Fallback if no quotes available
    const list = getWordListForConfig(config);
    return { words: generateWords(config, list), quoteInfo: null };
  }

  // Code mode: load a snippet and split into words
  if (config.mode === "code") {
    const snippet = getRandomSnippet(config.codeLanguage, config.quoteLength);
    if (snippet) {
      const words = snippet.text.split(/\s+/).filter((w) => w.length > 0);
      return {
        words: words.map((w) => applyFunboxTransform(w, config.funbox)),
        quoteInfo: { source: snippet.source, id: snippet.id },
      };
    }
    // Fallback
    const list = getWordListForConfig(config);
    return { words: generateWords(config, list), quoteInfo: null };
  }

  // CLI mode: load a command and split into words
  if (config.mode === "cli") {
    const command = getRandomCommand(config.cliCategory, config.quoteLength);
    if (command) {
      const words = command.text.split(/\s+/).filter((w) => w.length > 0);
      return {
        words: words.map((w) => applyFunboxTransform(w, config.funbox)),
        quoteInfo: { source: command.source, id: command.id },
      };
    }
    // Fallback
    const list = getWordListForConfig(config);
    return { words: generateWords(config, list), quoteInfo: null };
  }

  // Custom text mode
  if (config.mode === "custom" && config.customText) {
    let textWords = [...config.customText.text];
    if (config.customText.mode === "shuffle") {
      for (let i = textWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [textWords[i], textWords[j]] = [textWords[j]!, textWords[i]!];
      }
    }
    if (config.customText.limit.mode === "word" && config.customText.limit.value > 0) {
      textWords = textWords.slice(0, config.customText.limit.value);
    }
    return {
      words: textWords.map((w) => applyFunboxTransform(w, config.funbox)),
      quoteInfo: null,
    };
  }

  // Funbox-generated words
  if (hasFunboxThatGeneratesWords(config)) {
    const count = config.mode === "words" ? config.wordCount : 100;
    const words = generateFunboxWords(config, count);
    return { words, quoteInfo: null };
  }

  // Standard time or words mode
  const list = getWordListForConfig(config);
  const words = generateWords(config, list).map((w) => applyFunboxTransform(w, config.funbox));
  return { words, quoteInfo: null };
}

export function useGame(config: GameConfig) {
  const storeRef = useRef<Store | null>(null);
  const timerRef = useRef<GameTimer | null>(null);
  const previousWordsRef = useRef<string[] | null>(null);
  const isRepeatedRef = useRef(false);

  if (storeRef.current === null) {
    let words: string[];
    let quoteInfo: { source: string; id: number } | null = null;

    if (isRepeatedRef.current && previousWordsRef.current) {
      words = previousWordsRef.current;
    } else {
      const built = buildInitialWords(config);
      words = built.words;
      quoteInfo = built.quoteInfo;
      previousWordsRef.current = [...words];
    }

    const initialState = createInitialState(config, words);
    initialState.quoteInfo = quoteInfo;
    initialState.isRepeated = isRepeatedRef.current;
    initialState.previousWords = previousWordsRef.current;
    storeRef.current = createStore(initialState);
  }

  const store = storeRef.current;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      timerRef.current?.stop();
    };
  }, []);

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );

  const executeCommands = useCallback((commands: Command[]) => {
    for (const cmd of commands) {
      switch (cmd.type) {
        case "START_TIMER": {
          timerRef.current?.stop();
          const timer = createTimer(() => {
            const cmds = store.dispatch({ type: "TICK", now: performance.now() });
            executeCommands(cmds);
          });
          timerRef.current = timer;
          timer.start();
          break;
        }
        case "STOP_TIMER":
          timerRef.current?.stop();
          timerRef.current = null;
          break;
        case "GENERATE_WORDS": {
          const currentState = store.getState();
          const currentWords = currentState.words.words;

          if (hasFunboxThatGeneratesWords(config)) {
            const more = generateFunboxWords(config, 50);
            store.dispatch({ type: "ADD_WORDS", words: more });
          } else {
            const list = getWordListForConfig(config);
            const more = generateMoreWords(list, currentWords, 50)
              .map((w) => applyFunboxTransform(w, config.funbox));
            store.dispatch({ type: "ADD_WORDS", words: more });
          }
          break;
        }
      }
    }
  }, [store, config]);

  const dispatch = useCallback((event: GameEvent) => {
    const commands = store.dispatch(event);
    executeCommands(commands);
  }, [store, executeCommands]);

  return { state, dispatch };
}
