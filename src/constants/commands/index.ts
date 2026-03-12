import type { Quote, QuoteLength } from "../../engine/types.js";
import generalCommandsRaw from "./data/general.json" with { type: "json" };
import gitCommandsRaw from "./data/git.json" with { type: "json" };
import dockerCommandsRaw from "./data/docker.json" with { type: "json" };
import npmCommandsRaw from "./data/npm.json" with { type: "json" };
import linuxCommandsRaw from "./data/linux.json" with { type: "json" };

interface CommandCollection {
  category: string;
  groups: [number, number][];
  commands: Quote[];
}

// ── Fallback commands ───────────────────────────────────────────────

const FALLBACK_COMMANDS: Quote[] = [
  { id: 99001, text: "ls -la", source: "list files", length: 6, group: 0 },
  { id: 99002, text: "git status", source: "git", length: 10, group: 0 },
  { id: 99003, text: "docker ps -a", source: "docker", length: 12, group: 0 },
  { id: 99004, text: "npm install", source: "npm", length: 11, group: 0 },
];

// ── Build collection from raw JSON ─────────────────────────────────

function buildCollection(raw: { category?: string; groups?: number[][]; commands?: Array<{ id: number; text: string; source: string; length: number }> }): CommandCollection {
  const groups: [number, number][] = (raw.groups ?? [[0, 50], [51, 150], [151, 400], [401, 9999]]) as [number, number][];

  const commands: Quote[] = (raw.commands ?? []).map((c) => {
    const length = c.length;
    let group = 0;
    for (let g = 0; g < groups.length; g++) {
      const [min, max] = groups[g]!;
      if (length >= min && length <= max) {
        group = g;
        break;
      }
    }
    return { id: c.id, text: c.text, source: c.source, length, group };
  });

  return { category: raw.category ?? "unknown", groups, commands };
}

// ── Category → raw data mapping ─────────────────────────────────────

const RAW_DATA: Record<string, typeof generalCommandsRaw> = {
  general: generalCommandsRaw,
  git: gitCommandsRaw,
  docker: dockerCommandsRaw,
  npm: npmCommandsRaw,
  linux: linuxCommandsRaw,
};

const cache: Record<string, CommandCollection> = {};

// ── Public API ──────────────────────────────────────────────────────

export function loadCommands(category: string): CommandCollection {
  if (cache[category]) return cache[category];

  const raw = RAW_DATA[category];
  if (raw?.commands?.length > 0) {
    const collection = buildCollection(raw);
    cache[category] = collection;
    return collection;
  }

  // Fallback
  const fallback: CommandCollection = {
    category,
    groups: [[0, 50], [51, 150], [151, 400], [401, 9999]],
    commands: FALLBACK_COMMANDS,
  };
  cache[category] = fallback;
  return fallback;
}

export function getRandomCommand(
  category: string,
  lengths: QuoteLength[],
): Quote | null {
  const collection = loadCommands(category);
  if (collection.commands.length === 0) return null;

  const filtered = lengths.length > 0
    ? collection.commands.filter((c) => lengths.includes(c.group as QuoteLength))
    : collection.commands;

  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)]!;
}
