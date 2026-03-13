import React, { useMemo } from "react";
import { Box, Text } from "ink";
import type { GameState, TerminalTheme } from "../../engine/types.js";
import { computeErrorHeatmap, type WordErrorInfo } from "../../engine/errorAnalysis.js";

const MAX_WORDS = 4;
const MAX_VARIANTS = 3;

interface ErrorHeatmapProps {
  state: GameState;
  width: number;
  colors: TerminalTheme["colors"];
}

export const ErrorHeatmap: React.FC<ErrorHeatmapProps> = ({
  state,
  width,
  colors,
}) => {
  const errors = useMemo(
    () =>
      computeErrorHeatmap(
        state.input.history,
        state.words.words,
        state.words.activeWordIndex,
      ),
    [state.input.history, state.words.words, state.words.activeWordIndex],
  );

  if (errors.length === 0) return null;

  const topErrors = errors.slice(0, MAX_WORDS);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box justifyContent="center">
        <Text color={colors.sub}>missed words</Text>
      </Box>
      {topErrors.map((err, idx) => (
        <ErrorLine key={idx} error={err} width={width} colors={colors} />
      ))}
    </Box>
  );
};

interface ErrorLineProps {
  error: WordErrorInfo;
  width: number;
  colors: TerminalTheme["colors"];
}

const ErrorLine: React.FC<ErrorLineProps> = ({ error, width, colors }) => {
  const { target, typedVariants, errorCount, charErrorRates } = error;

  // Deduplicate variants
  const uniqueVariants = [...new Set(typedVariants)];
  const shownVariants = uniqueVariants.slice(0, MAX_VARIANTS);

  // Calculate how much space we have for variants
  // Format: " {target}  x{count}  -> {variant1} {variant2} ..."
  const prefix = ` ${target}  x${errorCount}`;
  const arrow = "  \u2192 ";
  const prefixLen = prefix.length + arrow.length;
  const availableForVariants = width - prefixLen;

  // Fit as many variants as possible within width
  const fittedVariants: string[] = [];
  let usedWidth = 0;
  for (const v of shownVariants) {
    const needed = usedWidth === 0 ? v.length : v.length + 1; // +1 for space separator
    if (usedWidth + needed > availableForVariants) break;
    fittedVariants.push(v);
    usedWidth += needed;
  }

  return (
    <Box justifyContent="center">
      <Text>
        <Text> </Text>
        {/* Target word with per-char error coloring */}
        {target.split("").map((char, ci) => {
          const rate = charErrorRates[ci] ?? 0;
          if (rate > 0.5) {
            return (
              <Text key={ci} color={colors.error} bold>
                {char}
              </Text>
            );
          } else if (rate > 0) {
            return (
              <Text key={ci} color={colors.error}>
                {char}
              </Text>
            );
          }
          return (
            <Text key={ci} color={colors.text}>
              {char}
            </Text>
          );
        })}
        <Text color={colors.sub}>  x{errorCount}</Text>
        {fittedVariants.length > 0 && (
          <>
            <Text color={colors.sub}>  {"\u2192"} </Text>
            <Text color={colors.errorExtra}>
              {fittedVariants.join(" ")}
            </Text>
          </>
        )}
      </Text>
    </Box>
  );
};
