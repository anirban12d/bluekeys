import type { FinalResult } from "./types.js";

// ── Aggregated History Stats ────────────────────────────────────────

export interface HistoryStats {
  totalTests: number;
  totalWords: number;
  totalErrors: number;
  overallAccuracy: number;
  averageWpm: number;
  bestWpm: number;
}

export interface MissedWordEntry {
  word: string;
  count: number;
  percentage: number; // relative to highest count, for bar sizing
}

export interface CharMistakeEntry {
  expected: string;
  typed: string;
  count: number;
}

export interface ErrorTrendPoint {
  accuracy: number;
  timestamp: number;
}

export interface HistoryAnalysis {
  stats: HistoryStats;
  topMissedWords: MissedWordEntry[];
  topCharMistakes: CharMistakeEntry[];
  errorTrend: ErrorTrendPoint[];
  practiceWords: string[];
}

/**
 * Analyze all historical results to produce cross-session error data.
 */
export function analyzeHistory(results: FinalResult[]): HistoryAnalysis {
  if (results.length === 0) {
    return {
      stats: {
        totalTests: 0,
        totalWords: 0,
        totalErrors: 0,
        overallAccuracy: 100,
        averageWpm: 0,
        bestWpm: 0,
      },
      topMissedWords: [],
      topCharMistakes: [],
      errorTrend: [],
      practiceWords: [],
    };
  }

  // ── Overall stats ──────────────────────────────────────────────────

  let totalWords = 0;
  let totalErrors = 0;
  let totalWpm = 0;
  let bestWpm = 0;
  let totalCorrectChars = 0;
  let totalIncorrectChars = 0;

  for (const r of results) {
    const wordCount = r.charStats.correctWordChars > 0
      ? Math.round((r.charStats.correctWordChars + r.charStats.incorrectChars + r.charStats.missedChars + r.charStats.extraChars) / 5)
      : Math.round(r.testDuration * r.rawWpm / 60);
    totalWords += wordCount;
    totalErrors += r.charStats.incorrectChars + r.charStats.extraChars;
    totalWpm += r.wpm;
    if (r.wpm > bestWpm) bestWpm = r.wpm;
    totalCorrectChars += r.charStats.allCorrectChars;
    totalIncorrectChars += r.charStats.incorrectChars;
  }

  const overallAccuracy = totalCorrectChars + totalIncorrectChars > 0
    ? (totalCorrectChars / (totalCorrectChars + totalIncorrectChars)) * 100
    : 100;

  const stats: HistoryStats = {
    totalTests: results.length,
    totalWords,
    totalErrors,
    overallAccuracy,
    averageWpm: totalWpm / results.length,
    bestWpm,
  };

  // ── Missed words aggregation ───────────────────────────────────────

  const wordCounts = new Map<string, number>();
  for (const r of results) {
    if (!r.missedWords) continue;
    for (const [word, count] of Object.entries(r.missedWords)) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + count);
    }
  }

  const sortedWords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1]);

  const maxCount = sortedWords.length > 0 ? sortedWords[0]![1] : 1;
  const topMissedWords: MissedWordEntry[] = sortedWords
    .slice(0, 15)
    .map(([word, count]) => ({
      word,
      count,
      percentage: (count / maxCount) * 100,
    }));

  // ── Character mistakes aggregation ─────────────────────────────────

  const charCounts = new Map<string, number>();
  for (const r of results) {
    if (!r.charMistakes) continue;
    for (const [pair, count] of Object.entries(r.charMistakes)) {
      charCounts.set(pair, (charCounts.get(pair) ?? 0) + count);
    }
  }

  const topCharMistakes: CharMistakeEntry[] = [...charCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pair, count]) => {
      const [expected, typed] = pair.split(">");
      return { expected: expected ?? "?", typed: typed ?? "?", count };
    });

  // ── Error trend (accuracy over time) ───────────────────────────────

  const errorTrend: ErrorTrendPoint[] = results
    .map((r) => ({
      accuracy: r.accuracy,
      timestamp: r.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // ── Practice suggestions ───────────────────────────────────────────
  // Top 5 most missed words that the user should practice
  const practiceWords = sortedWords.slice(0, 5).map(([word]) => word);

  return {
    stats,
    topMissedWords,
    topCharMistakes,
    errorTrend,
    practiceWords,
  };
}
