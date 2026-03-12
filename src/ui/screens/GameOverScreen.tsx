import React, { useMemo } from "react";
import { Box, Text, useInput } from "ink";
import type { GameState, TypingSpeedUnit, TerminalTheme } from "../../engine/types.js";
import { calculateFinalResult } from "../../engine/scoring.js";
import { roundTo2 } from "../../utils/format.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { checkAndUpdatePb } from "../../state/persistence.js";
import { useTheme } from "../hooks/useTheme.js";
import { mapNavAction } from "../../input/navigationKeys.js";

// ── Chart rendering ─────────────────────────────────────────────────

interface ChartCell {
  char: string;
  fg?: string;
  bg?: string;
}

function sampleData(data: number[], width: number): number[] {
  if (data.length === 0) return [];
  if (width <= 1) return [data[0]!];
  const result: number[] = [];
  for (let i = 0; i < width; i++) {
    const t = (i / (width - 1)) * (data.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(lo + 1, data.length - 1);
    const frac = t - lo;
    result.push(data[lo]! * (1 - frac) + data[hi]! * frac);
  }
  return result;
}

// Braille dot mapping within a 2x4 cell:
// Position (col, row) -> bit mask
// Col 0: dots 1,2,3,7   Col 1: dots 4,5,6,8
const BRAILLE_DOT_MAP = [
  [0x01, 0x08], // row 0
  [0x02, 0x10], // row 1
  [0x04, 0x20], // row 2
  [0x40, 0x80], // row 3
] as const;

function buildBrailleChart(
  wpmData: number[],
  rawData: number[],
  chartWidth: number,
  chartHeight: number,
  mainColor: string,
  subColor: string,
): { grid: ChartCell[][]; maxVal: number; minVal: number } {
  const allVals = [...wpmData, ...rawData];
  const maxVal = Math.max(...allVals);
  let minVal = Math.min(...allVals);
  minVal = Math.max(0, minVal - (maxVal - minVal) * 0.15);
  const range = maxVal - minVal || 1;

  // Braille resolution: each char = 2 pixels wide, 4 pixels tall
  const pixelW = chartWidth * 2;
  const pixelH = chartHeight * 4;

  const wpm = sampleData(wpmData, pixelW);
  const raw = sampleData(rawData, pixelW);

  function toPixelY(v: number): number {
    return Math.round((1 - (v - minVal) / range) * (pixelH - 1));
  }

  // Create pixel buffers
  const wpmPx: boolean[][] = Array.from({ length: pixelH }, () => Array(pixelW).fill(false) as boolean[]);
  const rawPx: boolean[][] = Array.from({ length: pixelH }, () => Array(pixelW).fill(false) as boolean[]);

  // Plot points with vertical line interpolation between consecutive points
  for (let px = 0; px < pixelW; px++) {
    const wy = toPixelY(wpm[px]!);
    const ry = toPixelY(raw[px]!);

    if (wy >= 0 && wy < pixelH) wpmPx[wy]![px] = true;
    if (ry >= 0 && ry < pixelH) rawPx[ry]![px] = true;

    if (px > 0) {
      // Interpolate vertically between prev and current
      const prevWy = toPixelY(wpm[px - 1]!);
      for (let y = Math.min(prevWy, wy); y <= Math.max(prevWy, wy); y++) {
        if (y >= 0 && y < pixelH) wpmPx[y]![px] = true;
      }
      const prevRy = toPixelY(raw[px - 1]!);
      for (let y = Math.min(prevRy, ry); y <= Math.max(prevRy, ry); y++) {
        if (y >= 0 && y < pixelH) rawPx[y]![px] = true;
      }
    }
  }

  // Convert pixel buffers to braille characters
  const grid: ChartCell[][] = [];

  for (let cr = 0; cr < chartHeight; cr++) {
    const row: ChartCell[] = [];
    for (let cc = 0; cc < chartWidth; cc++) {
      let wBits = 0;
      let rBits = 0;

      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const py = cr * 4 + dy;
          const px = cc * 2 + dx;
          if (py < pixelH && px < pixelW) {
            const bit = BRAILLE_DOT_MAP[dy]![dx]!;
            if (wpmPx[py]![px]) wBits |= bit;
            if (rawPx[py]![px]) rBits |= bit;
          }
        }
      }

      if (wBits > 0) {
        // WPM takes priority for color; combine both series' dots
        row.push({ char: String.fromCharCode(0x2800 + (wBits | rBits)), fg: mainColor });
      } else if (rBits > 0) {
        row.push({ char: String.fromCharCode(0x2800 + rBits), fg: subColor });
      } else {
        row.push({ char: " " });
      }
    }
    grid.push(row);
  }

  return { grid, maxVal, minVal: Math.round(minVal) };
}

interface ChartSegment {
  text: string;
  fg?: string;
  bg?: string;
}

function batchCells(row: ChartCell[]): ChartSegment[] {
  if (row.length === 0) return [];
  const segments: ChartSegment[] = [];
  let cur: ChartSegment = { text: row[0]!.char, fg: row[0]!.fg, bg: row[0]!.bg };

  for (let i = 1; i < row.length; i++) {
    const cell = row[i]!;
    if (cell.fg === cur.fg && cell.bg === cur.bg) {
      cur.text += cell.char;
    } else {
      segments.push(cur);
      cur = { text: cell.char, fg: cell.fg, bg: cell.bg };
    }
  }
  segments.push(cur);
  return segments;
}

interface AreaChartProps {
  wpmHistory: number[];
  rawHistory: number[];
  width: number;
  colors: TerminalTheme["colors"];
  unit: string;
  duration: number;
}

const CHART_HEIGHT = 8;

const AreaChart: React.FC<AreaChartProps> = ({
  wpmHistory,
  rawHistory,
  width,
  colors,
  unit,
  duration,
}) => {
  const { grid, maxVal, minVal } = useMemo(() => {
    const labelW = Math.max(String(Math.round(Math.max(...wpmHistory, ...rawHistory))).length, 3);
    const chartW = width - labelW - 1;
    return {
      ...buildBrailleChart(wpmHistory, rawHistory, chartW, CHART_HEIGHT, colors.main, colors.sub),
      labelW,
    };
  }, [wpmHistory, rawHistory, width, colors.main, colors.sub]);

  const labelW = Math.max(String(Math.round(maxVal)).length, String(minVal).length, 3);
  const chartW = width - labelW - 1;

  return (
    <Box flexDirection="column">
      {/* Legend */}
      <Box justifyContent="center" gap={2} marginBottom={0}>
        <Text color={colors.main}>{unit}</Text>
        <Text color={colors.sub}>raw</Text>
      </Box>

      {/* Chart rows */}
      {grid.map((row, rowIdx) => {
        let label = "";
        if (rowIdx === 0) label = String(Math.round(maxVal));
        else if (rowIdx === CHART_HEIGHT - 1) label = String(minVal);

        const segments = batchCells(row);

        return (
          <Box key={rowIdx} height={1}>
            <Text color={colors.sub}>{label.padStart(labelW)} </Text>
            <Text>
              {segments.map((seg, si) => (
                <Text
                  key={si}
                  color={seg.fg}
                  backgroundColor={seg.bg}
                >
                  {seg.text}
                </Text>
              ))}
            </Text>
          </Box>
        );
      })}

      {/* X-axis */}
      <Box>
        <Text color={colors.sub}>
          {" ".repeat(labelW + 1)}0s{" ".repeat(Math.max(0, chartW - 2 - String(Math.round(duration)).length - 1))}{Math.round(duration)}s
        </Text>
      </Box>
    </Box>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────

function convertSpeed(wpm: number, unit: TypingSpeedUnit): number {
  switch (unit) {
    case "wpm": return wpm;
    case "cpm": return wpm * 5;
    case "wps": return roundTo2(wpm / 60);
    case "cps": return roundTo2((wpm * 5) / 60);
    case "wph": return Math.round(wpm * 60);
  }
}

function speedLabel(unit: TypingSpeedUnit): string {
  return unit;
}

function getModeLabel(state: GameState): string {
  const { config } = state;
  const parts: string[] = [config.mode];

  if (config.mode === "time") parts.push(`${config.timeLimit}s`);
  else if (config.mode === "words") parts.push(`${config.wordCount}`);
  else if (config.mode === "code") parts.push(config.codeLanguage);
  else if (config.mode === "cli") parts.push(config.cliCategory);

  parts.push(config.language);
  if (config.punctuation) parts.push("punctuation");
  if (config.numbers) parts.push("numbers");
  if (config.difficulty !== "normal") parts.push(config.difficulty);

  return parts.join(" \u2022 ");
}

// ── Component ───────────────────────────────────────────────────────

interface GameOverScreenProps {
  state: GameState;
  onRestart: () => void;
  onRepeat?: () => void;
  onMenu?: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  state,
  onRestart,
  onRepeat,
  onMenu,
}) => {
  const { columns, rows } = useTerminalSize();
  const colors = useTheme(state.config.theme);
  const { typingSpeedUnit } = state.config;

  const result = useMemo(() => calculateFinalResult(state), [state]);

  const isPb = useMemo(() => {
    if (state.phase === "failed") return false;
    const mode2 = state.config.mode === "time"
      ? state.config.timeLimit
      : state.config.mode === "words"
        ? state.config.wordCount
        : 0;
    const fullResult = {
      ...result,
      mode: state.config.mode,
      mode2,
      language: state.config.language,
      punctuation: state.config.punctuation,
      numbers: state.config.numbers,
      difficulty: state.config.difficulty,
      lazyMode: state.config.lazyMode,
      blindMode: state.config.blindMode,
      funbox: state.config.funbox,
      quoteInfo: state.quoteInfo,
      timestamp: Date.now(),
      isPb: false,
      burstHistory: result.burstHistory ?? [],
    };
    return checkAndUpdatePb(fullResult);
  }, [result, state]);

  const keybindingMode = state.config.keybindingMode;

  useInput((input, key) => {
    const action = mapNavAction(input, key, keybindingMode);

    if (action === "tab") {
      onRestart();
    } else if (action === "confirm" && onRepeat) {
      onRepeat();
    } else if (action === "back" && onMenu) {
      onMenu();
    } else if (action === "back") {
      onRestart();
    }
  });

  const isFailed = state.phase === "failed";
  const { charStats } = result;
  const unit = speedLabel(typingSpeedUnit);
  const displayWpm = Math.round(convertSpeed(result.wpm, typingSpeedUnit));
  const displayRaw = Math.round(convertSpeed(result.rawWpm, typingSpeedUnit));

  const contentWidth = Math.min(columns - 8, 60);
  const hasChart = result.wpmHistory.length > 1;

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box flexGrow={1} />

      <Box
        flexDirection="column"
        alignItems="center"
        width={contentWidth}
      >
        {/* Title */}
        {isFailed && (
          <Text bold color={colors.error}>{state.failReason}</Text>
        )}

        {/* PB indicator */}
        {isPb && !isFailed && (
          <Box marginBottom={1}>
            <Text bold color={colors.main}>new personal best</Text>
          </Box>
        )}

        {/* Large WPM display */}
        <Box flexDirection="column" alignItems="center" marginBottom={2}>
          <Text color={colors.sub}>{unit}</Text>
          <Text bold color={colors.main}>
            {displayWpm}
          </Text>
        </Box>

        {/* Stats grid */}
        <Box gap={4} justifyContent="center" marginBottom={2}>
          <Box flexDirection="column" alignItems="center">
            <Text color={colors.sub}>raw</Text>
            <Text color={colors.text}>{displayRaw}</Text>
          </Box>
          <Box flexDirection="column" alignItems="center">
            <Text color={colors.sub}>accuracy</Text>
            <Text color={colors.text}>{roundTo2(result.accuracy)}%</Text>
          </Box>
          <Box flexDirection="column" alignItems="center">
            <Text color={colors.sub}>consistency</Text>
            <Text color={colors.text}>{roundTo2(result.consistency)}%</Text>
          </Box>
          <Box flexDirection="column" alignItems="center">
            <Text color={colors.sub}>time</Text>
            <Text color={colors.text}>{roundTo2(result.testDuration)}s</Text>
          </Box>
        </Box>

        {/* Character stats */}
        <Box gap={1} justifyContent="center" marginBottom={1}>
          <Text color={colors.sub}>characters</Text>
          <Text>
            <Text color={colors.main}>{charStats.correctWordChars}</Text>
            <Text color={colors.sub}>/</Text>
            <Text color={colors.error}>{charStats.incorrectChars}</Text>
            <Text color={colors.sub}>/</Text>
            <Text color={colors.errorExtra}>{charStats.extraChars}</Text>
            <Text color={colors.sub}>/</Text>
            <Text color={colors.sub}>{charStats.missedChars}</Text>
          </Text>
        </Box>

        {/* Area chart — WPM + raw overlaid */}
        {hasChart && (
          <Box marginTop={1}>
            <AreaChart
              wpmHistory={result.wpmHistory}
              rawHistory={result.rawHistory}
              width={contentWidth}
              colors={colors}
              unit={unit}
              duration={result.testDuration}
            />
          </Box>
        )}

        {/* Quote source */}
        {state.quoteInfo && (
          <Box marginTop={1} justifyContent="center">
            <Text color={colors.sub}>- {state.quoteInfo.source}</Text>
          </Box>
        )}

        {/* Mode info */}
        <Box marginTop={1}>
          <Text color={colors.sub}>{getModeLabel(state)}</Text>
        </Box>

        {/* Repeated test indicator */}
        {state.isRepeated && (
          <Text color={colors.main}>repeated</Text>
        )}
      </Box>

      {/* Bottom actions */}
      <Box flexGrow={1} />
      <Box marginBottom={1} gap={3} justifyContent="center">
        <Text color={colors.sub}>tab restart</Text>
        {onRepeat && <Text color={colors.sub}>enter repeat</Text>}
        <Text color={colors.sub}>
          {keybindingMode === "vim"
            ? "q/esc menu"
            : keybindingMode === "emacs"
              ? "C-g/esc menu"
              : "esc menu"}
        </Text>
        <Text color={colors.sub}>{process.platform === "darwin" ? "cmd+c" : "ctrl+c"} quit</Text>
      </Box>
    </Box>
  );
};
