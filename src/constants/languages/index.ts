import type { LanguageWordList } from "../../engine/types.js";

// Static imports — bundled into the binary, no filesystem needed at runtime
import englishRaw from "./data/english.json" with { type: "json" };
import english1kRaw from "./data/english_1k.json" with { type: "json" };
import frenchRaw from "./data/french.json" with { type: "json" };
import germanRaw from "./data/german.json" with { type: "json" };
import spanishRaw from "./data/spanish.json" with { type: "json" };
import codePythonRaw from "./data/code_python.json" with { type: "json" };
import codeJavascriptRaw from "./data/code_javascript.json" with { type: "json" };

// ── Raw data registry ───────────────────────────────────────────────

interface RawLanguage {
  name?: string;
  orderedByFrequency?: boolean;
  noLazyMode?: boolean;
  words?: string[];
}

const RAW_LANGUAGES: Record<string, RawLanguage> = {
  english: englishRaw,
  english_1k: english1kRaw,
  french: frenchRaw,
  german: germanRaw,
  spanish: spanishRaw,
  code_python: codePythonRaw,
  code_javascript: codeJavascriptRaw,
};

// ── Cache ───────────────────────────────────────────────────────────

const cache = new Map<string, LanguageWordList>();

// ── Public API ──────────────────────────────────────────────────────

export function loadLanguage(name: string): LanguageWordList {
  const cached = cache.get(name);
  if (cached) return cached;

  const raw = RAW_LANGUAGES[name];
  if (raw) {
    const lang: LanguageWordList = {
      name: raw.name ?? name,
      orderedByFrequency: raw.orderedByFrequency ?? false,
      noLazyMode: raw.noLazyMode ?? false,
      words: raw.words ?? [],
    };
    cache.set(name, lang);
    return lang;
  }

  // Unknown language — return empty fallback
  return { name, orderedByFrequency: true, words: [] };
}

export function listAvailableLanguages(): string[] {
  return Object.keys(RAW_LANGUAGES).sort();
}
