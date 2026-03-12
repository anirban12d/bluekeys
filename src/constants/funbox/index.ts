import type { FunboxName } from "../../engine/types.js";
import poetryData from "./poetry.json" with { type: "json" };

export interface FunboxDefinition {
  name: FunboxName;
  label: string;
  description: string;
  wordTransform?: (word: string) => string;
  spaceReplacement?: string;
  disablesPunctuation?: boolean;
  disablesNumbers?: boolean;
  disablesBackspace?: boolean;
  generatesOwnWords?: boolean;
  affectsWordCount?: boolean;
}

function mirrorWord(word: string): string {
  const mirrorMap: Record<string, string> = {
    a: "\u0252", b: "d", c: "\u0254", d: "b", e: "\u0258", f: "\uA188", g: "\u01EB",
    h: "\u029C", i: "i", j: "\uA781", k: "\u029E", l: "l", m: "m", n: "n",
    o: "o", p: "q", q: "p", r: "\u027F", s: "\uA645", t: "\u019A", u: "u",
    v: "v", w: "w", x: "x", y: "\u028E", z: "\uA643",
  };
  return word.split("").reverse().map((c) => mirrorMap[c.toLowerCase()] ?? c).join("");
}

function rot13(word: string): string {
  return word.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export const FUNBOX_LIST: FunboxDefinition[] = [
  { name: "none", label: "none", description: "Standard typing test" },
  {
    name: "mirror",
    label: "mirror",
    description: "Words are mirrored",
    wordTransform: mirrorWord,
  },
  {
    name: "upside_down",
    label: "upside down",
    description: "Words are flipped upside down",
    wordTransform: (w) => w.split("").reverse().join(""),
  },
  {
    name: "rAnDoMcAsE",
    label: "rAnDoMcAsE",
    description: "Random capitalization",
    wordTransform: (w) =>
      w.split("").map((c) => (Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase())).join(""),
  },
  {
    name: "capitals",
    label: "CAPITALS",
    description: "All words are capitalized",
    wordTransform: (w) => w.charAt(0).toUpperCase() + w.slice(1),
  },
  {
    name: "nospace",
    label: "nospace",
    description: "No spaces between words",
    spaceReplacement: "",
  },
  {
    name: "backwards",
    label: "backwards",
    description: "Type words backwards",
    wordTransform: (w) => w.split("").reverse().join(""),
  },
  {
    name: "ddoouubblleedd",
    label: "ddoouubblleedd",
    description: "Every character is doubled",
    wordTransform: (w) => w.split("").map((c) => c + c).join(""),
  },
  {
    name: "underscore_spaces",
    label: "underscore_spaces",
    description: "Spaces replaced with underscores",
    spaceReplacement: "_",
  },
  {
    name: "memory",
    label: "memory",
    description: "Words disappear after showing briefly",
  },
  {
    name: "read_ahead",
    label: "read ahead",
    description: "Only see the next few words",
  },
  {
    name: "read_ahead_easy",
    label: "read ahead easy",
    description: "Only see the next 5 words",
  },
  {
    name: "read_ahead_hard",
    label: "read ahead hard",
    description: "Only see the next 1 word",
  },
  {
    name: "no_quit",
    label: "no quit",
    description: "Cannot restart until test is done",
    disablesBackspace: false,
  },
  {
    name: "gibberish",
    label: "gibberish",
    description: "Random gibberish words",
    generatesOwnWords: true,
  },
  {
    name: "specials",
    label: "specials",
    description: "Special characters",
    generatesOwnWords: true,
  },
  {
    name: "IPv4",
    label: "IPv4",
    description: "Type IPv4 addresses",
    generatesOwnWords: true,
  },
  {
    name: "IPv6",
    label: "IPv6",
    description: "Type IPv6 addresses",
    generatesOwnWords: true,
  },
  {
    name: "binary",
    label: "binary",
    description: "Type binary numbers",
    generatesOwnWords: true,
  },
  {
    name: "hexadecimal",
    label: "hexadecimal",
    description: "Type hexadecimal numbers",
    generatesOwnWords: true,
  },
  {
    name: "rot13",
    label: "ROT13",
    description: "Words are ROT13 encoded",
    wordTransform: rot13,
  },
  {
    name: "instant_messaging",
    label: "instant messaging",
    description: "Chat style typing",
    wordTransform: (w) => w.toLowerCase(),
  },
  {
    name: "zipf",
    label: "zipf",
    description: "Word frequency follows Zipf distribution",
  },
  {
    name: "pseudolang",
    label: "pseudolang",
    description: "Pseudo-language words",
    generatesOwnWords: true,
  },
  {
    name: "poetry",
    label: "poetry",
    description: "Type poetry",
    generatesOwnWords: true,
  },
];

export function getFunbox(name: FunboxName): FunboxDefinition | undefined {
  return FUNBOX_LIST.find((f) => f.name === name);
}

export function applyFunboxTransform(word: string, funboxNames: FunboxName[]): string {
  let result = word;
  for (const name of funboxNames) {
    const fb = getFunbox(name);
    if (fb?.wordTransform) {
      result = fb.wordTransform(result);
    }
  }
  return result;
}

export function getRandomPoem(): { text: string; source: string; id: number } | null {
  const poems = poetryData as { id: number; text: string; source: string }[];
  if (poems.length === 0) return null;
  return poems[Math.floor(Math.random() * poems.length)]!;
}

export function generateFunboxWord(name: FunboxName): string {
  switch (name) {
    case "gibberish": {
      const consonants = "bcdfghjklmnpqrstvwxyz";
      const vowels = "aeiou";
      const len = 3 + Math.floor(Math.random() * 6);
      let word = "";
      for (let i = 0; i < len; i++) {
        const pool = i % 2 === 0 ? consonants : vowels;
        word += pool[Math.floor(Math.random() * pool.length)];
      }
      return word;
    }
    case "specials": {
      const chars = "!@#$%^&*()-_=+[]{}|;:',.<>?/~`";
      const len = 2 + Math.floor(Math.random() * 5);
      let word = "";
      for (let i = 0; i < len; i++) {
        word += chars[Math.floor(Math.random() * chars.length)];
      }
      return word;
    }
    case "IPv4":
      return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".");
    case "IPv6":
      return Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 65536).toString(16).padStart(4, "0"),
      ).join(":");
    case "binary": {
      const len = 4 + Math.floor(Math.random() * 9);
      return Array.from({ length: len }, () => (Math.random() > 0.5 ? "1" : "0")).join("");
    }
    case "hexadecimal": {
      const len = 2 + Math.floor(Math.random() * 7);
      return "0x" + Array.from({ length: len }, () =>
        "0123456789abcdef"[Math.floor(Math.random() * 16)],
      ).join("");
    }
    case "pseudolang": {
      const syllables = ["ba", "ka", "mi", "ro", "te", "nu", "fu", "sa", "li", "po", "de", "wa"];
      const count = 1 + Math.floor(Math.random() * 4);
      return Array.from({ length: count }, () =>
        syllables[Math.floor(Math.random() * syllables.length)],
      ).join("");
    }
    default:
      return "word";
  }
}
