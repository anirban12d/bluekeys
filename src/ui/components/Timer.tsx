import React from "react";
import { Box, Text } from "ink";
import type { GameState, TimerColor } from "../../engine/types.js";
import type { TerminalTheme } from "../../engine/types.js";
import { formatTime } from "../../utils/format.js";
import { useTheme } from "../hooks/useTheme.js";

interface TimerProps {
  state: GameState;
}

function getTimerColor(timerColor: TimerColor, colors: TerminalTheme["colors"]): string {
  switch (timerColor) {
    case "main": return colors.main;
    case "sub": return colors.sub;
    case "text": return colors.text;
  }
}

function getDisplayValue(state: GameState): string {
  if (state.config.mode === "time") {
    const remaining = Math.max(0, state.config.timeLimit - state.timing.elapsedSeconds);
    return String(remaining);
  }
  return String(state.timing.elapsedSeconds);
}

export const Timer: React.FC<TimerProps> = ({ state }) => {
  const { timerStyle, timerColor } = state.config;
  const colors = useTheme(state.config.theme);

  if (timerStyle === "off") return null;

  const color = getTimerColor(timerColor, colors);
  const display = getDisplayValue(state);

  if (timerStyle === "text") {
    // Large prominent display
    return (
      <Box justifyContent="center">
        <Text bold color={color}>
          {state.config.mode === "time" ? `${display}` : formatTime(state.timing.elapsedSeconds)}
        </Text>
      </Box>
    );
  }

  if (timerStyle === "mini") {
    // Compact display
    return (
      <Box justifyContent="center">
        <Text color={color}>{display}s</Text>
      </Box>
    );
  }

  // "bar" style - just show the number, progress bar is separate
  return (
    <Box justifyContent="center">
      <Text bold color={color}>{display}</Text>
    </Box>
  );
};
