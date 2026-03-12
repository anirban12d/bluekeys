import React from "react";
import { Box, Text } from "ink";

// Compact QWERTY keyboard layout
const KEYBOARD_ART = [
  "q w e r t y u i o p",
  " a s d f g h j k l",
  "  z x c v b n m",
];

// FIGlet "Slant" font — pure ASCII, renders cleanly in any monospace font
const BLUEKEYS_NAME = [
  "    __    __           __                  ",
  "   / /_  / /_  _____  / /_____  __  _______",
  "  / __ \\/ / / / / _ \\/ //_/ _ \\/ / / / ___/",
  " / /_/ / / /_/ /  __/ ,< /  __/ /_/ (__  ) ",
  "/_.___/_/\\__,_/\\___/_/|_|\\___/\\__, /____/  ",
  "                             /____/        ",
];

const NAME_ART_WIDTH = 47;
const KEYBOARD_ART_WIDTH = 20;

interface LogoProps {
  color: string;
  subColor?: string;
  terminalWidth: number;
}

export const Logo: React.FC<LogoProps> = ({ color, subColor, terminalWidth }) => {
  // Full art: keyboard + slant name for terminals wide enough
  if (terminalWidth >= NAME_ART_WIDTH + 4) {
    return (
      <Box flexDirection="column" alignItems="center">
        {KEYBOARD_ART.map((line, i) => (
          <Text key={`kb-${i}`} color={subColor ?? color}>{line}</Text>
        ))}
        <Box flexDirection="column" alignItems="center" marginTop={1}>
          {BLUEKEYS_NAME.map((line, i) => (
            <Text key={`name-${i}`} color={color}>{line}</Text>
          ))}
        </Box>
      </Box>
    );
  }

  // Medium: keyboard + plain text for terminals 24+ chars wide
  if (terminalWidth >= KEYBOARD_ART_WIDTH + 4) {
    return (
      <Box flexDirection="column" alignItems="center">
        {KEYBOARD_ART.map((line, i) => (
          <Text key={`kb-${i}`} color={subColor ?? color}>{line}</Text>
        ))}
        <Text bold color={color}>bluekeys</Text>
      </Box>
    );
  }

  // Fallback: plain text
  return <Text bold color={color}>bluekeys</Text>;
};
