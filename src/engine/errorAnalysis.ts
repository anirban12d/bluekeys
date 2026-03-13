// ── Error Analysis for Heatmap ──────────────────────────────────────

export interface WordErrorInfo {
  target: string;
  typedVariants: string[];
  errorCount: number;
  charErrorRates: number[];  // per-character error rate (0-1), length = target.length
}

/**
 * Compute error heatmap data from typed history vs target words.
 * Returns error info sorted by errorCount descending, only words with errors.
 */
export function computeErrorHeatmap(
  history: string[],
  words: string[],
  activeWordIndex: number,
): WordErrorInfo[] {
  // Group word occurrences by target text
  const groups = new Map<string, {
    totalOccurrences: number;
    charErrors: number[];   // per-char error count, length = target.length
    typedVariants: string[];
  }>();

  const lastIndex = Math.min(activeWordIndex, history.length);

  for (let i = 0; i < lastIndex; i++) {
    const target = words[i];
    const typed = history[i];
    if (!target || typed === undefined) continue;

    // Check if this word has any error
    if (!wordHasError(typed, target)) continue;

    let group = groups.get(target);
    if (!group) {
      group = {
        totalOccurrences: 0,
        charErrors: new Array(target.length).fill(0) as number[],
        typedVariants: [],
      };
      groups.set(target, group);
    }

    group.totalOccurrences++;
    group.typedVariants.push(typed);

    // Count per-character errors
    for (let c = 0; c < target.length; c++) {
      if (c >= typed.length || typed[c] !== target[c]) {
        group.charErrors[c]!++;
      }
    }
  }

  // Also count total occurrences of each word (including correct ones)
  // to compute accurate error rates
  const totalOccurrences = new Map<string, number>();
  for (let i = 0; i < lastIndex; i++) {
    const target = words[i];
    if (!target) continue;
    totalOccurrences.set(target, (totalOccurrences.get(target) ?? 0) + 1);
  }

  // Build results
  const results: WordErrorInfo[] = [];

  for (const [target, group] of groups) {
    const total = totalOccurrences.get(target) ?? group.totalOccurrences;
    const charErrorRates = group.charErrors.map((count) =>
      total > 0 ? count / total : 0,
    );

    results.push({
      target,
      typedVariants: group.typedVariants,
      errorCount: group.totalOccurrences,
      charErrorRates,
    });
  }

  // Sort by error count descending
  results.sort((a, b) => b.errorCount - a.errorCount);

  return results;
}

function wordHasError(typed: string, target: string): boolean {
  if (typed.length !== target.length) return true;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== target[i]) return true;
  }
  return false;
}
