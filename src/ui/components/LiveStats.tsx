import React from "react";
import { Box, Text } from "ink";
import type { GameState, TypingSpeedUnit } from "../../engine/types.js";
import { calculateAccuracy } from "../../engine/scoring.js";
import { roundTo2 } from "../../utils/format.js";
import { useTheme } from "../hooks/useTheme.js";

function convertSpeed(wpm: number, unit: TypingSpeedUnit): number {
  switch (unit) {
    case "wpm":
      return wpm;
    case "cpm":
      return wpm * 5;
    case "wps":
      return roundTo2(wpm / 60);
    case "cps":
      return roundTo2((wpm * 5) / 60);
    case "wph":
      return Math.round(wpm * 60);
  }
}

function speedLabel(unit: TypingSpeedUnit): string {
  switch (unit) {
    case "wpm": return "wpm";
    case "cpm": return "cpm";
    case "wps": return "wps";
    case "cps": return "cps";
    case "wph": return "wph";
  }
}

interface LiveStatsProps {
  state: GameState;
}

export const LiveStats: React.FC<LiveStatsProps> = ({ state }) => {
  const {
    liveSpeedStyle,
    liveAccStyle,
    liveBurstStyle,
    blindMode,
    typingSpeedUnit,
  } = state.config;

  const colors = useTheme(state.config.theme);

  // If all styles are off, render nothing
  if (liveSpeedStyle === "off" && liveAccStyle === "off" && liveBurstStyle === "off") {
    return null;
  }

  const wpm = state.metrics.wpmHistory.length > 0
    ? Math.round(state.metrics.wpmHistory[state.metrics.wpmHistory.length - 1]!)
    : 0;

  const raw = state.metrics.rawHistory.length > 0
    ? Math.round(state.metrics.rawHistory[state.metrics.rawHistory.length - 1]!)
    : 0;

  const acc = roundTo2(
    calculateAccuracy(state.metrics.accuracy.correct, state.metrics.accuracy.incorrect),
  );

  const burst = state.metrics.burstHistory.length > 0
    ? Math.round(state.metrics.burstHistory[state.metrics.burstHistory.length - 1]!)
    : 0;

  // In blind mode, show raw WPM instead of WPM, and 100% for accuracy
  const displaySpeed = blindMode ? raw : wpm;
  const displayAcc = blindMode ? 100 : acc;
  const displaySpeedConverted = convertSpeed(displaySpeed, typingSpeedUnit);
  const displayBurstConverted = convertSpeed(burst, typingSpeedUnit);
  const unit = speedLabel(typingSpeedUnit);

  const elements: React.ReactNode[] = [];

  // Speed stat
  if (liveSpeedStyle !== "off") {
    if (liveSpeedStyle === "text") {
      elements.push(
        <Box key="speed" flexDirection="column" alignItems="center">
          <Text color={colors.sub}>{unit}</Text>
          <Text bold color={colors.main}>{Math.round(displaySpeedConverted)}</Text>
        </Box>,
      );
    } else {
      // mini
      elements.push(
        <Text key="speed">
          <Text color={colors.sub}>{unit}: </Text><Text color={colors.main} bold>{Math.round(displaySpeedConverted)}</Text>
        </Text>,
      );
    }
  }

  // Accuracy stat
  if (liveAccStyle !== "off") {
    if (liveAccStyle === "text") {
      elements.push(
        <Box key="acc" flexDirection="column" alignItems="center">
          <Text color={colors.sub}>acc</Text>
          <Text bold color={colors.text}>{roundTo2(displayAcc)}%</Text>
        </Box>,
      );
    } else {
      elements.push(
        <Text key="acc">
          <Text color={colors.sub}>acc: </Text><Text color={colors.text}>{roundTo2(displayAcc)}%</Text>
        </Text>,
      );
    }
  }

  // Burst stat
  if (liveBurstStyle !== "off") {
    if (liveBurstStyle === "text") {
      elements.push(
        <Box key="burst" flexDirection="column" alignItems="center">
          <Text color={colors.sub}>burst</Text>
          <Text bold color={colors.text}>{Math.round(displayBurstConverted)}</Text>
        </Box>,
      );
    } else {
      elements.push(
        <Text key="burst">
          <Text color={colors.sub}>burst: </Text><Text color={colors.text}>{Math.round(displayBurstConverted)}</Text>
        </Text>,
      );
    }
  }

  // Determine layout based on whether any stat uses "text" style
  const hasTextStyle =
    liveSpeedStyle === "text" || liveAccStyle === "text" || liveBurstStyle === "text";

  return (
    <Box gap={hasTextStyle ? 4 : 2} justifyContent="center">
      {elements}
    </Box>
  );
};
