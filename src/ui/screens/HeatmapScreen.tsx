import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { TerminalTheme } from "../../engine/types.js";
import { loadResults } from "../../state/persistence.js";
import { analyzeHistory, type HistoryAnalysis, type MissedWordEntry, type CharMistakeEntry, type ErrorTrendPoint } from "../../engine/historyAnalysis.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { useTheme } from "../hooks/useTheme.js";
import { mapNavAction } from "../../input/navigationKeys.js";

// ── Bar rendering ───────────────────────────────────────────────────

const BAR_CHARS = [" ", "\u258F", "\u258E", "\u258D", "\u258C", "\u258B", "\u258A", "\u2589", "\u2588"] as const;

function renderBar(percentage: number, maxWidth: number): string {
  const fullBlocks = Math.floor((percentage / 100) * maxWidth);
  const remainder = ((percentage / 100) * maxWidth) - fullBlocks;
  const partialIdx = Math.round(remainder * 8);

  let bar = BAR_CHARS[8]!.repeat(fullBlocks);
  if (partialIdx > 0 && fullBlocks < maxWidth) {
    bar += BAR_CHARS[partialIdx] ?? "";
  }
  return bar;
}

// ── Trend sparkline ─────────────────────────────────────────────────

const SPARK_CHARS = ["\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"] as const;

function renderSparkline(data: number[], width: number): string {
  if (data.length === 0) return "";

  // Sample data to fit width
  const sampled: number[] = [];
  for (let i = 0; i < width; i++) {
    const t = (i / (width - 1)) * (data.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(lo + 1, data.length - 1);
    const frac = t - lo;
    sampled.push(data[lo]! * (1 - frac) + data[hi]! * frac);
  }

  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;

  return sampled
    .map((v) => {
      const normalized = (v - min) / range;
      const idx = Math.round(normalized * 7);
      return SPARK_CHARS[Math.min(idx, 7)]!;
    })
    .join("");
}

// ── Sections ────────────────────────────────────────────────────────

interface SectionProps {
  colors: TerminalTheme["colors"];
  width: number;
}

const StatsSection: React.FC<SectionProps & { analysis: HistoryAnalysis }> = ({
  colors,
  analysis,
}) => {
  const { stats } = analysis;
  return (
    <Box flexDirection="column" alignItems="center">
      <Box gap={3} justifyContent="center" flexWrap="wrap">
        <Box flexDirection="column" alignItems="center">
          <Text color={colors.sub}>tests</Text>
          <Text color={colors.text} bold>{stats.totalTests}</Text>
        </Box>
        <Box flexDirection="column" alignItems="center">
          <Text color={colors.sub}>words typed</Text>
          <Text color={colors.text} bold>{stats.totalWords.toLocaleString()}</Text>
        </Box>
        <Box flexDirection="column" alignItems="center">
          <Text color={colors.sub}>errors</Text>
          <Text color={colors.error} bold>{stats.totalErrors.toLocaleString()}</Text>
        </Box>
        <Box flexDirection="column" alignItems="center">
          <Text color={colors.sub}>accuracy</Text>
          <Text color={colors.text} bold>{stats.overallAccuracy.toFixed(1)}%</Text>
        </Box>
      </Box>
      <Box gap={3} justifyContent="center" marginTop={1}>
        <Box flexDirection="column" alignItems="center">
          <Text color={colors.sub}>avg wpm</Text>
          <Text color={colors.text} bold>{Math.round(stats.averageWpm)}</Text>
        </Box>
        <Box flexDirection="column" alignItems="center">
          <Text color={colors.sub}>best wpm</Text>
          <Text color={colors.main} bold>{Math.round(stats.bestWpm)}</Text>
        </Box>
      </Box>
    </Box>
  );
};

const MissedWordsSection: React.FC<
  SectionProps & { words: MissedWordEntry[]; scrollOffset: number; visibleCount: number }
> = ({ colors, width, words, scrollOffset, visibleCount }) => {
  if (words.length === 0) {
    return (
      <Box justifyContent="center">
        <Text color={colors.sub}>no missed words yet</Text>
      </Box>
    );
  }

  const maxWordLen = Math.max(...words.map((w) => w.word.length));
  const countCol = Math.max(...words.map((w) => String(w.count).length));
  const barMaxWidth = Math.max(1, width - maxWordLen - countCol - 8);

  const visible = words.slice(scrollOffset, scrollOffset + visibleCount);

  return (
    <Box flexDirection="column">
      {visible.map((entry, idx) => (
        <Box key={idx} justifyContent="center">
          <Text color={colors.text} bold>
            {entry.word.padEnd(maxWordLen)}
          </Text>
          <Text color={colors.sub}>
            {" "}x{String(entry.count).padStart(countCol)}{" "}
          </Text>
          <Text color={colors.error}>
            {renderBar(entry.percentage, barMaxWidth)}
          </Text>
        </Box>
      ))}
      {words.length > visibleCount && (
        <Box justifyContent="center" marginTop={0}>
          <Text color={colors.sub}>
            {scrollOffset > 0 ? "\u25B2 " : "  "}
            {Math.min(scrollOffset + visibleCount, words.length)}/{words.length}
            {scrollOffset + visibleCount < words.length ? " \u25BC" : "  "}
          </Text>
        </Box>
      )}
    </Box>
  );
};

const CharMistakesSection: React.FC<SectionProps & { mistakes: CharMistakeEntry[] }> = ({
  colors,
  mistakes,
}) => {
  if (mistakes.length === 0) {
    return (
      <Box justifyContent="center">
        <Text color={colors.sub}>no character data yet</Text>
      </Box>
    );
  }

  // Display in a compact grid: 4 per row
  const rows: CharMistakeEntry[][] = [];
  for (let i = 0; i < mistakes.length; i += 4) {
    rows.push(mistakes.slice(i, i + 4));
  }

  return (
    <Box flexDirection="column" alignItems="center">
      {rows.map((row, ri) => (
        <Box key={ri} gap={2} justifyContent="center">
          {row.map((m, mi) => (
            <Box key={mi} gap={0}>
              <Text color={colors.text} bold>{m.expected}</Text>
              <Text color={colors.sub}>{"\u2192"}</Text>
              <Text color={colors.error} bold>{m.typed}</Text>
              <Text color={colors.sub}> x{m.count}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

const TrendSection: React.FC<SectionProps & { trend: ErrorTrendPoint[] }> = ({
  colors,
  width,
  trend,
}) => {
  if (trend.length < 2) {
    return (
      <Box justifyContent="center">
        <Text color={colors.sub}>need more tests to show trend</Text>
      </Box>
    );
  }

  const accuracies = trend.map((t) => t.accuracy);
  const sparkWidth = Math.min(width - 4, 50);
  const sparkline = renderSparkline(accuracies, sparkWidth);

  const first5 = accuracies.slice(0, Math.min(5, Math.floor(accuracies.length / 2)));
  const last5 = accuracies.slice(-Math.min(5, Math.floor(accuracies.length / 2)));
  const earlyAvg = first5.reduce((a, b) => a + b, 0) / first5.length;
  const recentAvg = last5.reduce((a, b) => a + b, 0) / last5.length;
  const diff = recentAvg - earlyAvg;
  const improving = diff > 0;

  return (
    <Box flexDirection="column" alignItems="center">
      <Box justifyContent="center">
        <Text color={colors.main}>{sparkline}</Text>
      </Box>
      <Box gap={3} justifyContent="center" marginTop={0}>
        <Text color={colors.sub}>
          early avg {earlyAvg.toFixed(1)}%
        </Text>
        <Text color={colors.sub}>
          recent avg {recentAvg.toFixed(1)}%
        </Text>
        <Text color={improving ? colors.main : colors.error} bold>
          {improving ? "\u25B2" : "\u25BC"} {Math.abs(diff).toFixed(1)}%
        </Text>
      </Box>
    </Box>
  );
};

const PracticeSection: React.FC<SectionProps & { words: string[] }> = ({
  colors,
  words,
}) => {
  if (words.length === 0) {
    return (
      <Box justifyContent="center">
        <Text color={colors.sub}>complete some tests to get suggestions</Text>
      </Box>
    );
  }

  return (
    <Box justifyContent="center">
      <Text color={colors.sub}>focus on: </Text>
      <Text color={colors.main} bold>{words.join(", ")}</Text>
    </Box>
  );
};

// ── Main Screen ─────────────────────────────────────────────────────

interface HeatmapScreenProps {
  theme: string;
  keybindingMode: string;
  onBack: () => void;
}

type Section = "stats" | "words" | "chars" | "trend" | "practice";
const SECTIONS: Section[] = ["stats", "words", "chars", "trend", "practice"];

const SECTION_LABELS: Record<Section, string> = {
  stats: "overview",
  words: "most missed words",
  chars: "character mistakes",
  trend: "accuracy trend",
  practice: "practice suggestions",
};

export const HeatmapScreen: React.FC<HeatmapScreenProps> = ({
  theme,
  keybindingMode,
  onBack,
}) => {
  const { columns, rows } = useTerminalSize();
  const colors = useTheme(theme);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [wordScroll, setWordScroll] = useState(0);

  const analysis = useMemo(() => {
    const results = loadResults(10000);
    return analyzeHistory(results);
  }, []);

  const currentSection = SECTIONS[sectionIdx]!;

  const contentWidth = Math.min(columns - 4, 70);
  // Match settings page: cap content height so the panel stays compact and centered
  const contentHeight = Math.min(14, Math.max(5, rows - 16));
  const wordVisibleCount = contentHeight;

  useInput((input, key) => {
    const action = mapNavAction(input, key, keybindingMode as "normal" | "vim" | "emacs");

    if (action === "back") {
      onBack();
      return;
    }

    if (action === "left") {
      setSectionIdx((i) => Math.max(0, i - 1));
      setWordScroll(0);
    }
    if (action === "right") {
      setSectionIdx((i) => Math.min(SECTIONS.length - 1, i + 1));
      setWordScroll(0);
    }

    // Scroll within missed words section
    if (currentSection === "words") {
      if (action === "down") {
        setWordScroll((s) =>
          Math.min(s + 1, Math.max(0, analysis.topMissedWords.length - wordVisibleCount)),
        );
      }
      if (action === "up") {
        setWordScroll((s) => Math.max(0, s - 1));
      }
    }

    // Tab cycles sections
    if (action === "tab") {
      setSectionIdx((i) => (i + 1) % SECTIONS.length);
      setWordScroll(0);
    }
  });

  // No data state
  if (analysis.stats.totalTests === 0) {
    return (
      <Box
        width={columns}
        height={rows}
        flexDirection="column"
        alignItems="center"
      >
        {/* Top spacer */}
        <Box flexGrow={1} />

        <Box
          flexDirection="column"
          alignItems="center"
          width={contentWidth}
          gap={1}
        >
          <Text bold color={colors.main}>typing heatmap</Text>
          <Text color={colors.sub}>no test history yet</Text>
          <Text color={colors.sub}>complete some typing tests to see your error analysis</Text>
        </Box>

        {/* Bottom spacer */}
        <Box flexGrow={1} />
        <Box marginBottom={1}>
          <Text color={colors.sub}>
            {keybindingMode === "vim"
              ? "q/esc back"
              : keybindingMode === "emacs"
                ? "C-g/esc back"
                : "esc back"}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
    >
      {/* Top spacer */}
      <Box flexGrow={1} />

      {/* Center content */}
      <Box
        flexDirection="column"
        alignItems="center"
        width={contentWidth}
        gap={1}
      >
        {/* Title */}
        <Text bold color={colors.main}>typing heatmap</Text>

        {/* Section tabs */}
        <Box gap={1} justifyContent="center">
          {SECTIONS.map((sec, i) => (
            <Text
              key={sec}
              {...(i === sectionIdx
                ? { color: colors.main, bold: true, underline: true }
                : { color: colors.sub })}
            >
              {SECTION_LABELS[sec]}
            </Text>
          ))}
        </Box>

        {/* Separator */}
        <Text color={colors.sub} dimColor>
          {"\u2500".repeat(Math.min(contentWidth, 50))}
        </Text>

        {/* Section content — fixed height matching settings page */}
        <Box flexDirection="column" width={contentWidth} height={contentHeight}>
          {currentSection === "stats" && (
            <StatsSection analysis={analysis} colors={colors} width={contentWidth} />
          )}
          {currentSection === "words" && (
            <MissedWordsSection
              words={analysis.topMissedWords}
              colors={colors}
              width={contentWidth}
              scrollOffset={wordScroll}
              visibleCount={contentHeight}
            />
          )}
          {currentSection === "chars" && (
            <CharMistakesSection
              mistakes={analysis.topCharMistakes}
              colors={colors}
              width={contentWidth}
            />
          )}
          {currentSection === "trend" && (
            <TrendSection
              trend={analysis.errorTrend}
              colors={colors}
              width={contentWidth}
            />
          )}
          {currentSection === "practice" && (
            <PracticeSection
              words={analysis.practiceWords}
              colors={colors}
              width={contentWidth}
            />
          )}
        </Box>
      </Box>

      {/* Bottom spacer */}
      <Box flexGrow={1} />

      {/* Navigation help — pinned to bottom, matching settings page pattern */}
      <Box flexDirection="column" alignItems="center" marginBottom={1} gap={0}>
        <Box gap={2} marginTop={1}>
          <Text color={colors.sub}>tab: section</Text>
          <Text color={colors.sub}>
            {keybindingMode === "vim"
              ? "h/l: section  j/k: scroll"
              : keybindingMode === "emacs"
                ? "C-b/f: section  C-n/p: scroll"
                : "left/right: section  up/down: scroll"}
          </Text>
          <Text color={colors.sub}>
            {keybindingMode === "vim"
              ? "q: save & back"
              : keybindingMode === "emacs"
                ? "C-g: save & back"
                : "esc: back"}
          </Text>
          <Text color={colors.sub}>{process.platform === "darwin" ? "cmd+c" : "ctrl+c"} quit</Text>
        </Box>
      </Box>
    </Box>
  );
};
