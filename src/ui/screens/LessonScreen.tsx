import React, { useState, useMemo, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { findLesson } from "../../learn/curriculum.js";
import { generateLessonText } from "../../learn/lessonGenerator.js";
import { saveLessonResult } from "../../learn/progress.js";
import { Keyboard } from "../components/Keyboard.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { useTheme } from "../hooks/useTheme.js";
import { mapNavAction } from "../../input/navigationKeys.js";

// ── Lesson state ────────────────────────────────────────────────────

interface LessonState {
  phase: "active" | "finished";
  text: string;
  cursor: number;
  correct: number;
  incorrect: number;
  startTime: number | null;
  charResults: boolean[]; // true = correct, false = incorrect, per typed char
}

function starStr(n: number): string {
  return (
    (n >= 1 ? "\u2605" : "\u2606") +
    (n >= 2 ? "\u2605" : "\u2606") +
    (n >= 3 ? "\u2605" : "\u2606")
  );
}

// ── Component ───────────────────────────────────────────────────────

interface LessonScreenProps {
  lessonId: string;
  theme: string;
  keybindingMode: string;
  onBack: () => void;
  onNext?: () => void;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({
  lessonId,
  theme,
  keybindingMode,
  onBack,
  onNext,
}) => {
  const { columns, rows } = useTerminalSize();
  const colors = useTheme(theme);

  const lesson = useMemo(() => findLesson(lessonId), [lessonId]);
  const lessonText = useMemo(
    () => (lesson ? generateLessonText(lesson) : ""),
    [lesson],
  );

  const learnedKeys = useMemo(
    () => new Set(lesson?.allKeys ?? []),
    [lesson],
  );

  const [state, setState] = useState<LessonState>({
    phase: "active",
    text: lessonText,
    cursor: 0,
    correct: 0,
    incorrect: 0,
    startTime: null,
    charResults: [],
  });

  const [savedResult, setSavedResult] = useState<{
    accuracy: number;
    wpm: number;
    stars: number;
  } | null>(null);

  const finishLesson = useCallback(
    (finalState: LessonState) => {
      if (!lesson) return;
      const elapsed = finalState.startTime
        ? (performance.now() - finalState.startTime) / 1000
        : 1;
      const total = finalState.correct + finalState.incorrect;
      const accuracy = total > 0 ? (finalState.correct / total) * 100 : 100;
      const wpm = elapsed > 0 ? (finalState.correct / 5) * (60 / elapsed) : 0;

      const result = saveLessonResult(lesson.id, accuracy, wpm);
      setSavedResult({ accuracy, wpm, stars: result.stars });
    },
    [lesson],
  );

  useInput((input, key) => {
    const action = mapNavAction(input, key, keybindingMode as "normal" | "vim" | "emacs");

    // Finished phase
    if (state.phase === "finished") {
      if (action === "confirm" && onNext) {
        onNext();
        return;
      }
      if (action === "back") {
        onBack();
        return;
      }
      return;
    }

    // Active phase — escape quits
    if (action === "back") {
      onBack();
      return;
    }

    // Ignore non-printable keys
    if (key.ctrl || key.meta || key.escape || key.tab) return;
    if (!input || input.length !== 1) return;

    setState((prev) => {
      if (prev.phase !== "active") return prev;

      const now = performance.now();
      const startTime = prev.startTime ?? now;
      const expected = prev.text[prev.cursor];
      if (expected === undefined) return prev;

      const isCorrect = input === expected;
      const newCursor = prev.cursor + 1;
      const newCorrect = prev.correct + (isCorrect ? 1 : 0);
      const newIncorrect = prev.incorrect + (isCorrect ? 0 : 1);

      const newState: LessonState = {
        ...prev,
        cursor: newCursor,
        correct: newCorrect,
        incorrect: newIncorrect,
        startTime,
        charResults: [...prev.charResults, isCorrect],
      };

      // Check if lesson is complete
      if (newCursor >= prev.text.length) {
        newState.phase = "finished";
        // Schedule result save (can't call finishLesson directly in setState)
        setTimeout(() => finishLesson(newState), 0);
      }

      return newState;
    });
  });

  if (!lesson) {
    return (
      <Box width={columns} height={rows} flexDirection="column" alignItems="center" justifyContent="center">
        <Text color={colors.error}>Lesson not found: {lessonId}</Text>
      </Box>
    );
  }

  const contentWidth = Math.min(columns - 4, 70);
  const nextChar = state.text[state.cursor];
  const total = state.correct + state.incorrect;
  const accuracy = total > 0 ? (state.correct / total) * 100 : 100;
  const progressPct = Math.round((state.cursor / state.text.length) * 100);

  // ── Finished screen ───────────────────────────────────────────────

  if (state.phase === "finished" && savedResult) {
    return (
      <Box
        width={columns}
        height={rows}
        flexDirection="column"
        alignItems="center"
      >
        <Box flexGrow={1} />

        <Box flexDirection="column" alignItems="center" width={contentWidth} gap={1}>
          <Text bold color={colors.main}>lesson complete</Text>
          <Text color={colors.text} bold>{lesson.name}</Text>

          <Box marginTop={1}>
            <Text color={colors.main} bold>
              {starStr(savedResult.stars)}
            </Text>
          </Box>

          <Box gap={4} justifyContent="center" marginTop={1}>
            <Box flexDirection="column" alignItems="center">
              <Text color={colors.sub}>accuracy</Text>
              <Text color={colors.text} bold>{savedResult.accuracy.toFixed(1)}%</Text>
            </Box>
            <Box flexDirection="column" alignItems="center">
              <Text color={colors.sub}>speed</Text>
              <Text color={colors.text} bold>{Math.round(savedResult.wpm)} wpm</Text>
            </Box>
          </Box>

          {savedResult.stars < 3 && (
            <Box marginTop={1}>
              <Text color={colors.sub}>
                {savedResult.stars === 0
                  ? "aim for 80% accuracy to earn your first star"
                  : savedResult.stars === 1
                    ? "aim for 92% accuracy for two stars"
                    : "aim for 98% accuracy for three stars"}
              </Text>
            </Box>
          )}

          {savedResult.stars === 3 && (
            <Box marginTop={1}>
              <Text color={colors.main}>perfect! you mastered this lesson</Text>
            </Box>
          )}
        </Box>

        <Box flexGrow={1} />
        <Box marginBottom={1} gap={2} justifyContent="center">
          {onNext && <Text color={colors.sub}>enter: next lesson</Text>}
          <Text color={colors.sub}>
            {keybindingMode === "vim" ? "q: back to lessons" : "esc: back to lessons"}
          </Text>
        </Box>
      </Box>
    );
  }

  // ── Active typing screen ──────────────────────────────────────────

  // Build the character display — show a window around the cursor
  const displayWidth = Math.min(contentWidth - 4, 50);
  const windowStart = Math.max(0, state.cursor - Math.floor(displayWidth / 4));
  const windowEnd = Math.min(state.text.length, windowStart + displayWidth);
  const visibleText = state.text.slice(windowStart, windowEnd);

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
    >
      <Box flexGrow={1} />

      <Box flexDirection="column" alignItems="center" width={contentWidth} gap={1}>
        {/* Lesson title */}
        <Box gap={2} justifyContent="center">
          <Text color={colors.main} bold>{lesson.name}</Text>
          <Text color={colors.sub}>{progressPct}%</Text>
        </Box>

        {/* Progress bar */}
        <Box width={Math.min(contentWidth, 50)} height={1} justifyContent="center">
          <Text color={colors.sub}>
            {"\u2588".repeat(Math.round(progressPct / (100 / Math.min(contentWidth - 4, 40))))}
            {"\u2591".repeat(
              Math.max(0, Math.min(contentWidth - 4, 40) - Math.round(progressPct / (100 / Math.min(contentWidth - 4, 40)))),
            )}
          </Text>
        </Box>

        {/* Character display */}
        <Box justifyContent="center" marginTop={1}>
          <Text>
            {visibleText.split("").map((ch, i) => {
              const globalIdx = windowStart + i;
              const display = ch === " " ? "\u00B7" : ch;
              if (globalIdx < state.cursor) {
                // Already typed — color by correctness
                const wasCorrect = state.charResults[globalIdx];
                return (
                  <Text key={i} color={wasCorrect ? colors.text : colors.error} bold={!wasCorrect}>
                    {display}
                  </Text>
                );
              }
              if (globalIdx === state.cursor) {
                // Current character — cursor
                return (
                  <Text key={i} inverse bold color={colors.main}>
                    {display}
                  </Text>
                );
              }
              // Upcoming
              return (
                <Text key={i} color={colors.sub}>
                  {display}
                </Text>
              );
            })}
          </Text>
        </Box>

        {/* Live stats */}
        <Box gap={3} justifyContent="center">
          <Text color={colors.sub}>
            accuracy <Text color={accuracy >= 92 ? colors.main : colors.error} bold>{accuracy.toFixed(0)}%</Text>
          </Text>
          <Text color={colors.sub}>
            {state.cursor}/{state.text.length}
          </Text>
        </Box>

        {/* Keyboard */}
        <Box marginTop={1}>
          <Keyboard
            colors={colors}
            activeKey={nextChar}
            learnedKeys={learnedKeys}
          />
        </Box>
      </Box>

      <Box flexGrow={1} />
      <Box marginBottom={1} gap={2} justifyContent="center">
        <Text color={colors.sub}>
          {keybindingMode === "vim" ? "q: quit lesson" : "esc: quit lesson"}
        </Text>
      </Box>
    </Box>
  );
};
