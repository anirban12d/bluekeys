import type { TypingSpeedUnit } from "../engine/types.js";

// ── Rounding ────────────────────────────────────────────────────────

export function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Speed conversion ────────────────────────────────────────────────

/**
 * Convert a WPM value to the specified typing speed unit.
 *
 *  - wpm: words per minute (identity, 5 chars = 1 word)
 *  - cpm: characters per minute (wpm * 5)
 *  - wps: words per second (wpm / 60)
 *  - cps: characters per second (wpm * 5 / 60)
 *  - wph: words per hour (wpm * 60)
 */
export function convertSpeed(wpm: number, unit: TypingSpeedUnit): number {
  switch (unit) {
    case "wpm":
      return wpm;
    case "cpm":
      return wpm * 5;
    case "wps":
      return wpm / 60;
    case "cps":
      return (wpm * 5) / 60;
    case "wph":
      return wpm * 60;
    default:
      return wpm;
  }
}

// ── Speed formatting ────────────────────────────────────────────────

/**
 * Format a WPM value into the target typing speed unit as a display string.
 *
 * @param wpm       - The speed in words-per-minute
 * @param unit      - The desired display unit
 * @param decimals  - Whether to show 2 decimal places (default: false)
 */
export function formatSpeed(
  wpm: number,
  unit: TypingSpeedUnit,
  decimals: boolean = false,
): string {
  const converted = convertSpeed(wpm, unit);
  const value = decimals ? roundTo2(converted).toFixed(2) : Math.round(converted).toString();
  return `${value} ${unit}`;
}

// ── Legacy formatters (kept for backward compatibility) ─────────────

export function formatWpm(wpm: number): string {
  return Math.round(wpm).toString();
}

export function formatAccuracy(accuracy: number): string {
  return `${roundTo2(accuracy)}%`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
