import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { GameConfig, CustomTextConfig } from "../../engine/types.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { useTheme } from "../hooks/useTheme.js";
import { mapNavAction } from "../../input/navigationKeys.js";

interface CustomTextScreenProps {
  config: GameConfig;
  onStart: (config: GameConfig) => void;
  onBack: () => void;
}

export const CustomTextScreen: React.FC<CustomTextScreenProps> = ({
  config,
  onStart,
  onBack,
}) => {
  const { columns, rows } = useTerminalSize();
  const colors = useTheme(config.theme);
  const [textInput, setTextInput] = useState("");
  const [textMode, setTextMode] = useState<"repeat" | "shuffle">("repeat");
  const [limitMode, setLimitMode] = useState<"word" | "time" | "section">("word");
  const [limitValue, setLimitValue] = useState(0); // 0 = no limit
  const [row, setRow] = useState(0); // 0=text, 1=mode, 2=limit mode, 3=limit value, 4=start

  const keybindingMode = config.keybindingMode;

  useInput((input, key) => {
    // Escape always goes back (regardless of row)
    if (key.escape) {
      onBack();
      return;
    }

    // Row 0 = text input mode — no navigation keys, raw character input
    if (row === 0) {
      if (key.backspace) {
        setTextInput((t) => t.slice(0, -1));
        return;
      }
      if (key.return) {
        setRow(1);
        return;
      }
      if (input.length === 1 || input === " ") {
        setTextInput((t) => t + input);
        return;
      }
      if (key.tab) {
        setRow(1);
        return;
      }
      return;
    }

    // Rows 1+ = navigation mode — use keybinding-aware nav actions
    const action = mapNavAction(input, key, keybindingMode);

    if (action === "back") {
      onBack();
      return;
    }

    if (action === "up") setRow((r) => Math.max(1, r - 1));
    if (action === "down") setRow((r) => Math.min(4, r + 1));

    if (action === "left" || action === "right") {
      if (row === 1) {
        setTextMode((m) => (m === "repeat" ? "shuffle" : "repeat"));
      } else if (row === 2) {
        const modes: ("word" | "time" | "section")[] = ["word", "time", "section"];
        const idx = modes.indexOf(limitMode);
        const dir = action === "right" ? 1 : -1;
        const next = (idx + dir + modes.length) % modes.length;
        setLimitMode(modes[next]!);
      } else if (row === 3) {
        const dir = action === "right" ? 10 : -10;
        setLimitValue((v) => Math.max(0, v + dir));
      }
    }

    if (action === "confirm") {
      if (row === 4) {
        if (textInput.trim().length === 0) return;

        const words = textInput.trim().split(/\s+/).filter((w) => w.length > 0);
        const customText: CustomTextConfig = {
          text: words,
          mode: textMode,
          limit: { value: limitValue, mode: limitMode },
          pipeDelimiter: false,
        };

        const newConfig: GameConfig = {
          ...config,
          mode: "custom",
          customText,
        };
        onStart(newConfig);
        return;
      }
    }

    // Tab goes back to text input
    if (action === "tab" && row > 0) {
      setRow(0);
    }
  });

  const contentWidth = Math.min(columns - 4, 70);
  const textDisplayWidth = contentWidth - 4;

  // Wrap text for display
  const displayText = textInput.length > 0 ? textInput : "(type your text here)";
  const textLines: string[] = [];
  let remaining = displayText;
  while (remaining.length > 0) {
    textLines.push(remaining.slice(0, textDisplayWidth));
    remaining = remaining.slice(textDisplayWidth);
  }

  const wordCount = textInput.trim().split(/\s+/).filter((w) => w.length > 0).length;

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        flexDirection="column"
        alignItems="center"
        gap={1}
        width={contentWidth}
      >
        {/* Title */}
        <Text bold color={colors.main}>custom text</Text>

        {/* Text input area */}
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor={row === 0 ? colors.main : colors.sub}
          paddingX={1}
          width={contentWidth}
          minHeight={3}
        >
          {textLines.map((line, i) => (
            <Text key={i} color={textInput.length > 0 ? colors.text : colors.sub}>
              {line}
              {i === textLines.length - 1 && row === 0 && (
                <Text color={colors.caret} inverse>{" "}</Text>
              )}
            </Text>
          ))}
        </Box>
        <Text color={colors.sub}>{wordCount} words entered</Text>

        {/* Mode toggle */}
        <Box gap={2} justifyContent="center">
          <Text color={colors.sub}>mode:</Text>
          <Text
            {...(textMode === "repeat"
              ? (row === 1
                ? { inverse: true, color: colors.main }
                : { color: colors.main, bold: true })
              : (row === 1 ? { color: colors.sub, underline: true } : { color: colors.sub }))}
          >
            {" "}repeat{" "}
          </Text>
          <Text
            {...(textMode === "shuffle"
              ? (row === 1
                ? { inverse: true, color: colors.main }
                : { color: colors.main, bold: true })
              : (row === 1 ? { color: colors.sub, underline: true } : { color: colors.sub }))}
          >
            {" "}shuffle{" "}
          </Text>
        </Box>

        {/* Limit mode */}
        <Box gap={2} justifyContent="center">
          <Text color={colors.sub}>limit by:</Text>
          {(["word", "time", "section"] as const).map((m) => (
            <Text
              key={m}
              {...(limitMode === m
                ? (row === 2
                  ? { inverse: true, color: colors.main }
                  : { color: colors.main, bold: true })
                : (row === 2 ? { color: colors.sub, underline: true } : { color: colors.sub }))}
            >
              {" "}{m}{" "}
            </Text>
          ))}
        </Box>

        {/* Limit value */}
        <Box gap={2} justifyContent="center">
          <Text color={colors.sub}>limit value:</Text>
          <Text
            {...(row === 3 ? { inverse: true } : { color: colors.main })}
          >
            {" "}{limitValue === 0 ? "no limit" : limitValue}{" "}
          </Text>
          {row === 3 && <Text color={colors.sub}>(left/right to change)</Text>}
        </Box>

        {/* Start button */}
        <Box marginTop={1} justifyContent="center">
          <Text
            {...(row === 4 ? { inverse: true } : { color: colors.main })}
          >
            {"  "}start{"  "}
          </Text>
        </Box>

        {/* Navigation */}
        <Box gap={2} justifyContent="center">
          <Text color={colors.sub}>tab: toggle text/options</Text>
          <Text color={colors.sub}>enter: confirm</Text>
          <Text color={colors.sub}>esc: back</Text>
          <Text color={colors.sub}>{process.platform === "darwin" ? "cmd+c" : "ctrl+c"}: quit</Text>
        </Box>
      </Box>
    </Box>
  );
};
