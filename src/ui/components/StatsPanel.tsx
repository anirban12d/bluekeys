import React from "react";
import { Box, Text } from "ink";
import type { GameState, TypingSpeedUnit } from "../../engine/types.js";
import { calculateAccuracy } from "../../engine/scoring.js";
import { roundTo2 } from "../../utils/format.js";
import { getAverageWpm } from "../../state/persistence.js";

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
  switch (unit) {
    case "wpm": return "wpm";
    case "cpm": return "cpm";
    case "wps": return "wps";
    case "cps": return "cps";
    case "wph": return "wph";
  }
}

interface StatsPanelProps {
  state: GameState;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ state }) => {
  const {
    blindMode,
    typingSpeedUnit,
    showAverage,
    liveSpeedStyle,
    liveAccStyle,
    liveBurstStyle,
  } = state.config;

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

  const unit = speedLabel(typingSpeedUnit);

  // In blind mode, show raw instead of wpm, and 100% for accuracy
  const displayWpm = blindMode ? raw : wpm;
  const displayAcc = blindMode ? 100 : acc;

  const displayWpmConverted = Math.round(convertSpeed(displayWpm, typingSpeedUnit));
  const displayRawConverted = Math.round(convertSpeed(raw, typingSpeedUnit));
  const displayBurstConverted = Math.round(convertSpeed(burst, typingSpeedUnit));

  const elements: React.ReactNode[] = [];

  // Only show stats not already shown in LiveStats
  if (liveSpeedStyle === "off") {
    elements.push(
      <Text key="wpm">{unit}: <Text color="cyan" bold>{displayWpmConverted}</Text></Text>,
    );
  }

  elements.push(
    <Text key="raw">raw: <Text color="cyan">{displayRawConverted}</Text></Text>,
  );

  if (liveAccStyle === "off") {
    elements.push(
      <Text key="acc">acc: <Text color="green">{roundTo2(displayAcc)}%</Text></Text>,
    );
  }

  if (liveBurstStyle === "off") {
    elements.push(
      <Text key="burst">burst: <Text color="magenta">{displayBurstConverted}</Text></Text>,
    );
  }

  // Show average if configured
  if (showAverage !== "off") {
    const mode2 = state.config.mode === "time" ? state.config.timeLimit : state.config.wordCount;
    const avgWpm = getAverageWpm(state.config.mode, mode2);
    if (avgWpm > 0) {
      const avgConverted = Math.round(convertSpeed(avgWpm, typingSpeedUnit));
      if (showAverage === "speed" || showAverage === "both") {
        elements.push(
          <Text key="avg">avg: <Text color="yellow">{avgConverted}</Text></Text>,
        );
      }
    }
  }

  return (
    <Box gap={2} justifyContent="center">
      {elements}
    </Box>
  );
};
