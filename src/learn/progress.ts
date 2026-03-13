import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ── Types ───────────────────────────────────────────────────────────

export interface LessonResult {
  accuracy: number;
  wpm: number;
  stars: number; // 0-3
  completedAt: number;
}

export interface LearnProgress {
  lessons: Record<string, LessonResult>;
}

// ── Persistence ─────────────────────────────────────────────────────

function getConfigDir(): string {
  if (process.platform === "win32") {
    const appData = process.env["APPDATA"];
    if (appData) return join(appData, ".bluekeys");
  }
  return join(homedir(), ".bluekeys");
}

const DATA_DIR = getConfigDir();
const PROGRESS_FILE = join(DATA_DIR, "learn-progress.json");

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadProgress(): LearnProgress {
  try {
    const data = readFileSync(PROGRESS_FILE, "utf-8");
    return JSON.parse(data) as LearnProgress;
  } catch {
    return { lessons: {} };
  }
}

export function saveProgress(progress: LearnProgress): void {
  ensureDir();
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
}

// ── Helpers ─────────────────────────────────────────────────────────

export function calculateStars(accuracy: number): number {
  if (accuracy >= 98) return 3;
  if (accuracy >= 92) return 2;
  if (accuracy >= 80) return 1;
  return 0;
}

export function saveLessonResult(
  lessonId: string,
  accuracy: number,
  wpm: number,
): LessonResult {
  const progress = loadProgress();
  const stars = calculateStars(accuracy);
  const existing = progress.lessons[lessonId];

  // Keep best result
  if (!existing || stars > existing.stars || (stars === existing.stars && wpm > existing.wpm)) {
    progress.lessons[lessonId] = {
      accuracy,
      wpm,
      stars,
      completedAt: Date.now(),
    };
  }

  saveProgress(progress);
  return progress.lessons[lessonId]!;
}

export function getLessonResult(lessonId: string): LessonResult | null {
  const progress = loadProgress();
  return progress.lessons[lessonId] ?? null;
}

export function getTotalStars(): number {
  const progress = loadProgress();
  return Object.values(progress.lessons).reduce((sum, r) => sum + r.stars, 0);
}
