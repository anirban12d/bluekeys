import type { Quote, QuoteLength } from "../../engine/types.js";
import pythonSnippetsRaw from "./data/python.json" with { type: "json" };
import javascriptSnippetsRaw from "./data/javascript.json" with { type: "json" };
import goSnippetsRaw from "./data/go.json" with { type: "json" };
import rustSnippetsRaw from "./data/rust.json" with { type: "json" };

interface SnippetCollection {
  language: string;
  groups: [number, number][];
  snippets: Quote[];
}

// ── Fallback snippets ───────────────────────────────────────────────

const FALLBACK_SNIPPETS: Quote[] = [
  { id: 99001, text: "def hello(): print('Hello, World!')", source: "Python Basics", length: 35, group: 0 },
  { id: 99002, text: "const x = [1, 2, 3].map(n => n * 2);", source: "JavaScript Map", length: 37, group: 0 },
  { id: 99003, text: "func main() { fmt.Println(\"hello\") }", source: "Go Basics", length: 36, group: 0 },
  { id: 99004, text: "fn main() { println!(\"hello\"); }", source: "Rust Basics", length: 32, group: 0 },
];

// ── Build collection from raw JSON ─────────────────────────────────

function buildCollection(raw: { language?: string; groups?: number[][]; snippets?: Array<{ id: number; text: string; source: string; length: number }> }): SnippetCollection {
  const groups: [number, number][] = (raw.groups ?? [[0, 100], [101, 300], [301, 600], [601, 9999]]) as [number, number][];

  const snippets: Quote[] = (raw.snippets ?? []).map((s) => {
    const length = s.length;
    let group = 0;
    for (let g = 0; g < groups.length; g++) {
      const [min, max] = groups[g]!;
      if (length >= min && length <= max) {
        group = g;
        break;
      }
    }
    return { id: s.id, text: s.text, source: s.source, length, group };
  });

  return { language: raw.language ?? "unknown", groups, snippets };
}

// ── Language → raw data mapping ─────────────────────────────────────

const RAW_DATA: Record<string, typeof pythonSnippetsRaw> = {
  python: pythonSnippetsRaw,
  javascript: javascriptSnippetsRaw,
  go: goSnippetsRaw,
  rust: rustSnippetsRaw,
};

const cache: Record<string, SnippetCollection> = {};

// ── Public API ──────────────────────────────────────────────────────

export function loadSnippets(language: string): SnippetCollection {
  if (cache[language]) return cache[language];

  const raw = RAW_DATA[language];
  if (raw?.snippets?.length > 0) {
    const collection = buildCollection(raw);
    cache[language] = collection;
    return collection;
  }

  // Fallback
  const fallback: SnippetCollection = {
    language,
    groups: [[0, 100], [101, 300], [301, 600], [601, 9999]],
    snippets: FALLBACK_SNIPPETS,
  };
  cache[language] = fallback;
  return fallback;
}

export function getRandomSnippet(
  language: string,
  lengths: QuoteLength[],
): Quote | null {
  const collection = loadSnippets(language);
  if (collection.snippets.length === 0) return null;

  const filtered = lengths.length > 0
    ? collection.snippets.filter((s) => lengths.includes(s.group as QuoteLength))
    : collection.snippets;

  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)]!;
}
