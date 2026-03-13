import React from "react";
import { Box, Text } from "ink";
import type { TerminalTheme } from "../../engine/types.js";
import {
  KEYBOARD_ROWS,
  HOME_KEYS,
  getFingerForKey,
  FINGER_LABELS,
  FINGER_COLOR_INDEX,
  type Finger,
} from "../../learn/keyboard.js";

// 8 distinct colors for fingers, derived from theme
function getFingerColors(colors: TerminalTheme["colors"]): string[] {
  return [
    "#e06c75", // left pinky — red
    "#e5c07b", // left ring — yellow
    "#61afef", // left middle — blue
    "#98c379", // left index — green
    "#c678dd", // right index — purple
    "#56b6c2", // right middle — cyan
    "#d19a66", // right ring — orange
    colors.error, // right pinky — theme error
  ];
}

interface KeyboardProps {
  colors: TerminalTheme["colors"];
  activeKey?: string;        // key to highlight (the next key to press)
  learnedKeys?: Set<string>; // keys the user has learned
}

export const Keyboard: React.FC<KeyboardProps> = ({
  colors,
  activeKey,
  learnedKeys,
}) => {
  const fingerColors = getFingerColors(colors);
  const activeLower = activeKey?.toLowerCase();
  const activeFinger = activeKey ? getFingerForKey(activeKey) : null;

  return (
    <Box flexDirection="column" alignItems="center">
      {KEYBOARD_ROWS.map((row, ri) => (
        <Box key={ri} justifyContent="center">
          {/* Indent for keyboard stagger */}
          <Text>{ri === 0 ? " " : ri === 1 ? "  " : "   "}</Text>
          {row.map((key) => {
            const isActive = key === activeLower || key === activeKey;
            const finger = getFingerForKey(key);
            const colorIdx = FINGER_COLOR_INDEX[finger];
            const isLearned = learnedKeys ? learnedKeys.has(key) : true;
            const isHome = HOME_KEYS.has(key);

            let display = key === ";" ? ";" : key.toUpperCase();
            if (key === ",") display = ",";
            if (key === ".") display = ".";
            if (key === "/") display = "/";

            if (isActive) {
              return (
                <Text key={key} inverse bold color={fingerColors[colorIdx]}>
                  {` ${display} `}
                </Text>
              );
            }

            if (!isLearned) {
              return (
                <Text key={key} color={colors.sub} dimColor>
                  {` ${display.toLowerCase()} `}
                </Text>
              );
            }

            return (
              <Text
                key={key}
                color={fingerColors[colorIdx]}
                bold={isHome}
                underline={isHome}
              >
                {` ${display} `}
              </Text>
            );
          })}
        </Box>
      ))}

      {/* Space bar */}
      <Box justifyContent="center" marginTop={0}>
        <Text
          {...(activeKey === " "
            ? { inverse: true, bold: true, color: colors.main }
            : { color: colors.sub })}
        >
          {"     space     "}
        </Text>
      </Box>

      {/* Finger guide */}
      {activeFinger && (
        <Box justifyContent="center" marginTop={1}>
          <Text color={colors.sub}>
            {FINGER_LABELS[activeFinger]}
          </Text>
          <Text color={colors.text} bold>
            {" \u2192 "}
          </Text>
          <Text color={fingerColors[FINGER_COLOR_INDEX[activeFinger]]} bold>
            {activeKey === " " ? "space" : activeKey}
          </Text>
        </Box>
      )}
    </Box>
  );
};

// ── Finger legend ───────────────────────────────────────────────────

interface FingerLegendProps {
  colors: TerminalTheme["colors"];
}

export const FingerLegend: React.FC<FingerLegendProps> = ({ colors }) => {
  const fingerColors = getFingerColors(colors);
  const fingers: Finger[] = [
    "left-pinky", "left-ring", "left-middle", "left-index",
    "right-index", "right-middle", "right-ring", "right-pinky",
  ];

  return (
    <Box gap={1} justifyContent="center" flexWrap="wrap">
      {fingers.map((f) => (
        <Text key={f} color={fingerColors[FINGER_COLOR_INDEX[f]]}>
          {FINGER_LABELS[f].split(" ")[1]?.charAt(0).toUpperCase()}
          {FINGER_LABELS[f].split(" ")[1]?.slice(1, 3)}
        </Text>
      ))}
    </Box>
  );
};
