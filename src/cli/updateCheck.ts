import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { VERSION } from "./version.js";

// ── Config dir ──────────────────────────────────────────────────────

function getConfigDir(): string {
  if (process.platform === "win32") {
    const appData = process.env["APPDATA"];
    if (appData) return join(appData, ".bluekeys");
  }
  return join(homedir(), ".bluekeys");
}

const DATA_DIR = getConfigDir();
const CACHE_FILE = join(DATA_DIR, "update-check.json");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UpdateCache {
  latestVersion: string;
  checkedAt: number;
}

// ── Version comparison ──────────────────────────────────────────────

function parseVersion(v: string): number[] {
  return v.replace(/^v/, "").split(".").map(Number);
}

export function isNewer(latest: string, current: string): boolean {
  const l = parseVersion(latest);
  const c = parseVersion(current);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

// ── Cache ───────────────────────────────────────────────────────────

function readCache(): UpdateCache | null {
  try {
    const data = JSON.parse(readFileSync(CACHE_FILE, "utf-8")) as UpdateCache;
    return data;
  } catch {
    return null;
  }
}

function writeCache(cache: UpdateCache): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(cache), "utf-8");
  } catch {
    // ignore
  }
}

// ── Fetch latest version from npm ───────────────────────────────────

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("https://registry.npmjs.org/bluekeys/latest", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Check for updates (non-blocking, uses 24h cache).
 * Returns the latest version string if an update is available, null otherwise.
 */
export async function checkForUpdate(): Promise<string | null> {
  // Check cache first
  const cache = readCache();
  if (cache && Date.now() - cache.checkedAt < CHECK_INTERVAL_MS) {
    return isNewer(cache.latestVersion, VERSION) ? cache.latestVersion : null;
  }

  // Fetch from npm
  const latest = await fetchLatestVersion();
  if (!latest) return null;

  writeCache({ latestVersion: latest, checkedAt: Date.now() });
  return isNewer(latest, VERSION) ? latest : null;
}

/**
 * Blocking check for the `check-update` command.
 */
export async function checkUpdateCommand(): Promise<void> {
  console.log(`Current version: v${VERSION}`);
  console.log("Checking for updates...");

  const latest = await fetchLatestVersion();
  if (!latest) {
    console.log("Could not reach the npm registry. Check your connection.");
    return;
  }

  writeCache({ latestVersion: latest, checkedAt: Date.now() });

  if (isNewer(latest, VERSION)) {
    console.log(`\nUpdate available: v${VERSION} → v${latest}`);
    console.log("Run `bluekeys upgrade` to update.");
  } else {
    console.log(`\nYou're on the latest version (v${VERSION}).`);
  }
}
