import React from "react";
import { Box, Text } from "ink";
import type { GameState, TimerColor } from "../../engine/types.js";
import type { TerminalTheme } from "../../engine/types.js";
import { useTheme } from "../hooks/useTheme.js";

interface ProgressBarProps {
  state: GameState;
  width?: number;
}

function getTimerColor(timerColor: TimerColor, colors: TerminalTheme["colors"]): string {
  switch (timerColor) {
    case "main": return colors.main;
    case "sub": return colors.sub;
    case "text": return colors.text;
  }
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ state, width = 40 }) => {
  const { timerStyle, timerColor } = state.config;
  const colors = useTheme(state.config.theme);

  if (timerStyle === "off") return null;

  let progress: number;
  let label: string;

  if (state.config.mode === "time") {
    const remaining = Math.max(0, state.config.timeLimit - state.timing.elapsedSeconds);
    progress = state.config.timeLimit > 0
      ? state.timing.elapsedSeconds / state.config.timeLimit
      : 0;
    label = `${remaining}s`;
  } else if (state.config.mode === "zen") {
    // Zen mode has no progress bar, just show elapsed
    progress = 0;
    label = `${state.timing.elapsedSeconds}s`;
  } else {
    progress = state.words.words.length > 0
      ? state.words.activeWordIndex / state.words.words.length
      : 0;
    label = `${state.words.activeWordIndex}/${state.words.words.length}`;
  }

  progress = Math.min(1, Math.max(0, progress));
  const color = getTimerColor(timerColor, colors);

  if (timerStyle === "text") {
    return (
      <Box justifyContent="center">
        <Text color={color}>{label}</Text>
      </Box>
    );
  }

  if (timerStyle === "mini") {
    // Compact progress: [====>    ] 15s
    const barWidth = Math.min(20, width);
    const filled = Math.round(progress * barWidth);
    const empty = barWidth - filled;
    return (
      <Box justifyContent="center" gap={1}>
        <Text>
          <Text color={color}>{"=".repeat(filled)}{filled < barWidth ? ">" : ""}</Text>
          <Text color={colors.sub}>{" ".repeat(Math.max(0, empty - 1))}</Text>
        </Text>
        <Text color={colors.sub}>{label}</Text>
      </Box>
    );
  }

  // "bar" style (default)
  const filled = Math.round(progress * width);
  const empty = width - filled;

  return (
    <Box justifyContent="center" gap={1}>
      <Text>
        <Text color={color}>{"\u2588".repeat(filled)}</Text>
        <Text color={colors.subAlt}>{"\u2591".repeat(empty)}</Text>
      </Text>
      <Text color={colors.sub}>{label}</Text>
    </Box>
  );
};
