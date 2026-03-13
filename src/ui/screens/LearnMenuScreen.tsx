import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { CURRICULUM, getAllLessons, type Lesson } from "../../learn/curriculum.js";
import { loadProgress, getTotalStars, type LessonResult } from "../../learn/progress.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { useTheme } from "../hooks/useTheme.js";
import { mapNavAction } from "../../input/navigationKeys.js";

// ── Star display ────────────────────────────────────────────────────

function starDisplay(result: LessonResult | null): string {
  if (!result) return "\u25CB\u25CB\u25CB";
  const stars = result.stars;
  return (
    (stars >= 1 ? "\u2605" : "\u2606") +
    (stars >= 2 ? "\u2605" : "\u2606") +
    (stars >= 3 ? "\u2605" : "\u2606")
  );
}

// ── Flat item for scrolling ─────────────────────────────────────────

type ListItem =
  | { type: "level"; name: string; levelIdx: number }
  | { type: "section"; name: string }
  | { type: "lesson"; lesson: Lesson; result: LessonResult | null; idx: number };

function buildList(progress: ReturnType<typeof loadProgress>): ListItem[] {
  const items: ListItem[] = [];
  let lessonIdx = 0;

  for (let li = 0; li < CURRICULUM.length; li++) {
    const level = CURRICULUM[li]!;
    items.push({ type: "level", name: level.name, levelIdx: li });

    for (const section of level.sections) {
      items.push({ type: "section", name: section.name });

      for (const lesson of section.lessons) {
        const result = progress.lessons[lesson.id] ?? null;
        items.push({ type: "lesson", lesson, result, idx: lessonIdx });
        lessonIdx++;
      }
    }
  }

  return items;
}

// ── Component ───────────────────────────────────────────────────────

interface LearnMenuScreenProps {
  theme: string;
  keybindingMode: string;
  onBack: () => void;
  onStartLesson: (lessonId: string) => void;
}

export const LearnMenuScreen: React.FC<LearnMenuScreenProps> = ({
  theme,
  keybindingMode,
  onBack,
  onStartLesson,
}) => {
  const { columns, rows } = useTerminalSize();
  const colors = useTheme(theme);
  const progress = useMemo(() => loadProgress(), []);
  const totalStars = useMemo(() => getTotalStars(), []);
  const allLessons = useMemo(() => getAllLessons(), []);
  const maxStars = allLessons.length * 3;

  const items = useMemo(() => buildList(progress), [progress]);

  // Only lesson items are selectable
  const selectableIndices = items
    .map((item, i) => (item.type === "lesson" ? i : -1))
    .filter((i) => i >= 0);

  const clampSelect = (idx: number) =>
    Math.max(0, Math.min(selectableIndices.length - 1, idx));

  const [selectPos, setSelectPos] = useState(0);
  const currentItemIdx = selectableIndices[clampSelect(selectPos)] ?? 0;

  useInput((input, key) => {
    const action = mapNavAction(input, key, keybindingMode as "normal" | "vim" | "emacs");

    if (action === "back") {
      onBack();
      return;
    }

    if (action === "up") {
      setSelectPos((p) => clampSelect(p - 1));
    }
    if (action === "down") {
      setSelectPos((p) => clampSelect(p + 1));
    }

    if (action === "confirm") {
      const item = items[currentItemIdx];
      if (item?.type === "lesson") {
        onStartLesson(item.lesson.id);
      }
    }
  });

  const contentWidth = Math.min(columns - 4, 70);
  const listHeight = Math.min(14, Math.max(5, rows - 16));

  // Scroll to keep selected visible
  const scrollOffset = Math.min(
    Math.max(0, currentItemIdx - listHeight + 3),
    Math.max(0, items.length - listHeight),
  );

  const visibleItems = items.slice(scrollOffset, scrollOffset + listHeight);

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
    >
      <Box flexGrow={1} />

      <Box
        flexDirection="column"
        alignItems="center"
        width={contentWidth}
        gap={1}
      >
        {/* Title */}
        <Text bold color={colors.main}>learn to type</Text>

        {/* Progress summary */}
        <Box gap={2} justifyContent="center">
          <Text color={colors.sub}>
            {totalStars}/{maxStars} {"\u2605"}
          </Text>
          <Text color={colors.sub}>
            {Object.keys(progress.lessons).length}/{allLessons.length} completed
          </Text>
        </Box>

        {/* Separator */}
        <Text color={colors.sub} dimColor>
          {"\u2500".repeat(Math.min(contentWidth, 50))}
        </Text>

        {/* Lesson list */}
        <Box flexDirection="column" width={contentWidth} height={listHeight}>
          {visibleItems.map((item, displayIdx) => {
            const actualIdx = scrollOffset + displayIdx;
            const isSelected = actualIdx === currentItemIdx;

            if (item.type === "level") {
              return (
                <Box key={`level-${item.levelIdx}`}>
                  <Text bold color={colors.main}>
                    {item.name}
                  </Text>
                </Box>
              );
            }

            if (item.type === "section") {
              return (
                <Box key={`section-${item.name}`}>
                  <Text color={colors.sub} dimColor>
                    {"  "}{item.name}
                  </Text>
                </Box>
              );
            }

            // Lesson item
            const { lesson, result } = item;
            const stars = starDisplay(result);
            const wpmStr = result ? `${Math.round(result.wpm)} wpm` : "";
            const nameWidth = contentWidth - 16;
            const name = lesson.name.length > nameWidth
              ? lesson.name.slice(0, nameWidth - 1) + "\u2026"
              : lesson.name.padEnd(nameWidth);

            return (
              <Box key={lesson.id} justifyContent="space-between" width={contentWidth}>
                <Box>
                  <Text color={isSelected ? colors.main : colors.sub}>
                    {isSelected ? " \u25B8 " : "   "}
                  </Text>
                  <Text
                    bold={isSelected}
                    color={isSelected ? colors.text : colors.sub}
                  >
                    {name}
                  </Text>
                </Box>
                <Box gap={1}>
                  {wpmStr && (
                    <Text color={colors.sub} dimColor>{wpmStr}</Text>
                  )}
                  <Text color={result && result.stars > 0 ? colors.main : colors.sub}>
                    {stars}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Scroll indicator */}
        <Box justifyContent="center" height={1}>
          {items.length > listHeight ? (
            <Text color={colors.sub}>
              {scrollOffset > 0 ? "\u25B2 " : "  "}
              {clampSelect(selectPos) + 1}/{selectableIndices.length}
              {scrollOffset + listHeight < items.length ? " \u25BC" : "  "}
            </Text>
          ) : (
            <Text> </Text>
          )}
        </Box>
      </Box>

      {/* Bottom nav */}
      <Box flexGrow={1} />
      <Box flexDirection="column" alignItems="center" marginBottom={1} gap={0}>
        <Box gap={2} marginTop={1}>
          <Text color={colors.sub}>enter: start lesson</Text>
          <Text color={colors.sub}>
            {keybindingMode === "vim"
              ? "j/k: navigate"
              : keybindingMode === "emacs"
                ? "C-n/p: navigate"
                : "up/down: navigate"}
          </Text>
          <Text color={colors.sub}>
            {keybindingMode === "vim"
              ? "q: back"
              : keybindingMode === "emacs"
                ? "C-g: back"
                : "esc: back"}
          </Text>
          <Text color={colors.sub}>{process.platform === "darwin" ? "cmd+c" : "ctrl+c"} quit</Text>
        </Box>
      </Box>
    </Box>
  );
};
