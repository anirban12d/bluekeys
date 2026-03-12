import type { LanguageWordList } from "../../engine/types.js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
// Also check relative to project root when running via tsx
const ALT_DATA_DIR = join(__dirname, "..", "..", "..", "src", "constants", "languages", "data");

function getDataDir(): string {
  if (existsSync(DATA_DIR)) return DATA_DIR;
  if (existsSync(ALT_DATA_DIR)) return ALT_DATA_DIR;
  return DATA_DIR;
}

const cache = new Map<string, LanguageWordList>();

export function loadLanguage(name: string): LanguageWordList {
  const cached = cache.get(name);
  if (cached) return cached;

  const dir = getDataDir();
  const filePath = join(dir, `${name}.json`);

  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    const lang: LanguageWordList = {
      name: raw.name ?? name,
      orderedByFrequency: raw.orderedByFrequency ?? false,
      noLazyMode: raw.noLazyMode ?? false,
      words: raw.words ?? [],
    };
    cache.set(name, lang);
    return lang;
  } catch {
    // Fallback to basic english embedded in languages/words.json
    return { name, orderedByFrequency: true, words: [] };
  }
}

export function listAvailableLanguages(): string[] {
  const dir = getDataDir();
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
  } catch {
    return ["english"];
  }
}
