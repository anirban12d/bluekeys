import React, { useMemo, useState, useEffect, useRef } from "react";
import { Box, Text } from "ink";
import type {
  GameState,
  HighlightMode,
  CaretStyle,
  FunboxName,
  TerminalTheme,
} from "../../engine/types.js";
import { useTheme } from "../hooks/useTheme.js";

type CharStatus =
  | "correct"
  | "incorrect"
  | "extra"
  | "untyped"
  | "cursor"
  | "highlight";

interface CharToken {
  char: string;
  status: CharStatus;
}

interface BatchedSegment {
  text: string;
  status: CharStatus;
}

interface WordLine {
  wordIndices: number[];
  width: number;
}

function isHighlighted(
  wordIndex: number,
  activeIndex: number,
  mode: HighlightMode,
): boolean {
  if (mode === "off") return false;
  if (mode === "letter") return false;
  if (mode === "word") return wordIndex === activeIndex;
  if (mode === "next_word") return wordIndex === activeIndex || wordIndex === activeIndex + 1;
  if (mode === "next_two_words") return wordIndex >= activeIndex && wordIndex <= activeIndex + 2;
  if (mode === "next_three_words") return wordIndex >= activeIndex && wordIndex <= activeIndex + 3;
  return false;
}

function buildTokens(
  state: GameState,
  highlightMode: HighlightMode,
  hideExtraLetters: boolean,
  caretStyle: CaretStyle,
): CharToken[][] {
  const { words, input } = state;
  const result: CharToken[][] = [];

  for (let wi = 0; wi < words.words.length; wi++) {
    const target = words.words[wi]!;
    const typed =
      wi < input.history.length
        ? input.history[wi]!
        : wi === words.activeWordIndex
          ? input.current
          : "";

    const isActiveWord = wi === words.activeWordIndex;
    const highlighted = isHighlighted(wi, words.activeWordIndex, highlightMode);
    const tokens: CharToken[] = [];

    for (let ci = 0; ci < Math.max(target.length, typed.length); ci++) {
      if (ci < typed.length && ci < target.length) {
        const isCorrect = typed[ci] === target[ci];
        if (isCorrect) {
          tokens.push({ char: target[ci]!, status: "correct" });
        } else {
          tokens.push({ char: target[ci]!, status: "incorrect" });
        }
      } else if (ci >= target.length) {
        if (hideExtraLetters) continue;
        tokens.push({ char: typed[ci]!, status: "extra" });
      } else {
        if (isActiveWord && ci === typed.length && caretStyle !== "off") {
          tokens.push({ char: target[ci]!, status: "cursor" });
        } else if (highlighted || (highlightMode === "letter" && isActiveWord)) {
          tokens.push({ char: target[ci]!, status: "highlight" });
        } else {
          tokens.push({ char: target[ci]!, status: "untyped" });
        }
      }
    }

    // If active word and no chars typed, mark first char as cursor
    if (
      isActiveWord &&
      typed.length === 0 &&
      tokens.length > 0 &&
      caretStyle !== "off" &&
      (tokens[0]!.status === "untyped" || tokens[0]!.status === "highlight")
    ) {
      tokens[0] = { ...tokens[0]!, status: "cursor" };
    }

    result.push(tokens);
  }

  return result;
}

function batchTokens(tokens: CharToken[]): BatchedSegment[] {
  if (tokens.length === 0) return [];
  const segments: BatchedSegment[] = [];
  let current: BatchedSegment = {
    text: tokens[0]!.char,
    status: tokens[0]!.status,
  };

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.status === current.status) {
      current.text += token.char;
    } else {
      segments.push(current);
      current = { text: token.char, status: token.status };
    }
  }
  segments.push(current);
  return segments;
}

function getStatusProps(
  status: CharStatus,
  caretStyle: CaretStyle,
  cursorVisible: boolean,
  colors: TerminalTheme["colors"],
): { color?: string; dimColor?: boolean; underline?: boolean; inverse?: boolean; bold?: boolean } {
  switch (status) {
    case "correct":
      return { color: colors.text, bold: true };
    case "incorrect":
      return { color: colors.error };
    case "extra":
      return { color: colors.errorExtra };
    case "untyped":
      return { color: colors.sub };
    case "highlight":
      return { color: colors.text, bold: true };
    case "cursor":
      if (!cursorVisible) {
        // When cursor is hidden (blink off phase), show the underlying char as untyped
        return { color: colors.sub };
      }
      if (caretStyle === "block") {
        return { color: colors.caret, inverse: true };
      }
      if (caretStyle === "underline") {
        return { color: colors.caret, underline: true };
      }
      return { color: colors.caret };
    default:
      return {};
  }
}

// Compute line breaks based on word widths and extra typed chars
function computeLines(
  words: string[],
  typedWords: string[],
  currentInput: string,
  activeWordIndex: number,
  maxWidth: number,
  nospace: boolean,
  hideExtraLetters: boolean,
): WordLine[] {
  const lines: WordLine[] = [];
  let currentLine: WordLine = { wordIndices: [], width: 0 };

  for (let i = 0; i < words.length; i++) {
    const target = words[i]!;
    let displayLen = target.length;

    // Account for extra chars in typed words
    if (!hideExtraLetters) {
      const typed =
        i < typedWords.length
          ? typedWords[i]!
          : i === activeWordIndex
            ? currentInput
            : "";
      if (typed.length > target.length) {
        displayLen = typed.length;
      }
    }

    const separator = nospace ? 0 : 1;
    const needed = currentLine.wordIndices.length > 0 ? displayLen + separator : displayLen;

    if (currentLine.width + needed > maxWidth && currentLine.wordIndices.length > 0) {
      lines.push(currentLine);
      currentLine = { wordIndices: [i], width: displayLen };
    } else {
      currentLine.wordIndices.push(i);
      currentLine.width += needed;
    }
  }

  if (currentLine.wordIndices.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function getReadAheadLimit(funbox: FunboxName[]): number | null {
  if (funbox.includes("read_ahead_hard")) return 1;
  if (funbox.includes("read_ahead")) return 3;
  if (funbox.includes("read_ahead_easy")) return 5;
  return null;
}

interface WordStreamProps {
  state: GameState;
  width?: number;
}

export const WordStream: React.FC<WordStreamProps> = ({ state, width = 60 }) => {
  const {
    highlightMode,
    hideExtraLetters,
    caretStyle,
    typedEffect,
    tapeMode,
    funbox,
  } = state.config;

  const colors = useTheme(state.config.theme);
  const nospace = funbox.includes("nospace");
  const readAheadLimit = getReadAheadLimit(funbox);
  const isMemory = funbox.includes("memory");
  const activeIdx = state.words.activeWordIndex;

  const scrolledPastRef = useRef(0);

  // Blinking cursor: toggles every 530ms
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Reset cursor to visible on any typing activity
  useEffect(() => {
    setCursorVisible(true);
  }, [state.input.current, activeIdx]);

  const [memoryRevealedUntil, setMemoryRevealedUntil] = useState(
    Math.min(activeIdx + 3, state.words.words.length),
  );

  useEffect(() => {
    if (isMemory) {
      const newReveal = Math.min(activeIdx + 3, state.words.words.length);
      if (newReveal > memoryRevealedUntil) {
        setMemoryRevealedUntil(newReveal);
        const timer = setTimeout(() => {
          setMemoryRevealedUntil(activeIdx + 1);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIdx, isMemory, memoryRevealedUntil, state.words.words.length]);

  const allWordTokens = useMemo(
    () => buildTokens(state, highlightMode, hideExtraLetters, caretStyle),
    [state, highlightMode, hideExtraLetters, caretStyle],
  );

  const lines = useMemo(
    () => computeLines(
      state.words.words,
      state.input.history,
      state.input.current,
      state.words.activeWordIndex,
      width,
      nospace,
      hideExtraLetters,
    ),
    [state.words.words, state.input.history, state.input.current, state.words.activeWordIndex, width, nospace, hideExtraLetters],
  );

  const activeLineIdx = useMemo(() => {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.wordIndices.includes(activeIdx)) return i;
    }
    return 0;
  }, [lines, activeIdx]);

  // Update scrolledPast when active line moves past line 1
  if (activeLineIdx > scrolledPastRef.current + 1) {
    scrolledPastRef.current = activeLineIdx - 1;
  }

  let startLine: number;
  let endLine: number;
  const VISIBLE_LINES = 3;

  if (tapeMode === "word" || tapeMode === "letter") {
    startLine = activeLineIdx;
    endLine = activeLineIdx + 1;
  } else {
    startLine = scrolledPastRef.current;
    endLine = Math.min(lines.length, startLine + VISIBLE_LINES);
  }

  const visibleLines = lines.slice(startLine, endLine);
  const rows: React.ReactNode[] = [];

  for (let rowIdx = 0; rowIdx < VISIBLE_LINES; rowIdx++) {
    const line = visibleLines[rowIdx];

    if (!line) {
      rows.push(
        <Box key={`empty-${rowIdx}`} height={1}>
          <Text> </Text>
        </Box>,
      );
      continue;
    }

    const lineIdx = startLine + rowIdx;

    rows.push(
      <Box key={lineIdx} flexDirection="row" flexWrap="nowrap" height={1}>
        {line.wordIndices.map((wi, wordPos) => {
          const tokens = allWordTokens[wi];
          if (!tokens) return null;

          const isPastWord = wi < activeIdx;

          if (readAheadLimit !== null && wi > activeIdx + readAheadLimit) {
            const blankLen = state.words.words[wi]?.length ?? 0;
            return (
              <React.Fragment key={wi}>
                {wordPos > 0 && !nospace && <Text> </Text>}
                <Text color={colors.sub}>{" ".repeat(blankLen)}</Text>
              </React.Fragment>
            );
          }

          if (isMemory && wi > memoryRevealedUntil && wi !== activeIdx) {
            const blankLen = state.words.words[wi]?.length ?? 0;
            return (
              <React.Fragment key={wi}>
                {wordPos > 0 && !nospace && <Text> </Text>}
                <Text color={colors.sub}>{" ".repeat(blankLen)}</Text>
              </React.Fragment>
            );
          }

          if (isPastWord && typedEffect === "hide") {
            const blankLen = state.words.words[wi]?.length ?? 0;
            return (
              <React.Fragment key={wi}>
                {wordPos > 0 && !nospace && <Text> </Text>}
                <Text>{" ".repeat(blankLen)}</Text>
              </React.Fragment>
            );
          }

          const segments = batchTokens(tokens);

          return (
            <React.Fragment key={wi}>
              {wordPos > 0 && !nospace && <Text> </Text>}
              <Text>
                {segments.map((seg, si) => {
                  const props = getStatusProps(seg.status, caretStyle, cursorVisible, colors);
                  if (isPastWord && typedEffect === "fade" && seg.status === "untyped") {
                    return (
                      <Text key={si} color={colors.sub}>
                        {seg.text}
                      </Text>
                    );
                  }
                  return (
                    <Text
                      key={si}
                      color={props.color}
                      dimColor={props.dimColor}
                      underline={props.underline}
                      inverse={props.inverse}
                      bold={props.bold}
                    >
                      {seg.text}
                    </Text>
                  );
                })}
              </Text>
            </React.Fragment>
          );
        })}
      </Box>,
    );
  }

  return (
    <Box flexDirection="column" width={width}>
      {rows}
    </Box>
  );
};
