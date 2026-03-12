import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import type {
  GameConfig,
} from "../../engine/types.js";
import { getThemeNames } from "../../config/themes.js";
import { listAvailableLanguages } from "../../constants/languages/index.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { useTheme } from "../hooks/useTheme.js";
import { mapNavAction } from "../../input/navigationKeys.js";

interface SettingItem {
  key: keyof GameConfig;
  label: string;
  description: string;
  category: string;
  values: readonly (string | number | boolean)[];
  format?: (v: string | number | boolean) => string;
}

const boolFormat = (v: string | number | boolean) => v ? "on" : "off";

const SETTINGS: SettingItem[] = [
  // Test
  { key: "mode", label: "mode", description: "Choose the type of test: timed, word count, quote, zen, or custom", category: "test", values: ["time", "words", "quote", "zen", "custom"] },
  { key: "timeLimit", label: "time limit", description: "Duration in seconds for timed tests", category: "test", values: [15, 30, 60, 120, 300] },
  { key: "wordCount", label: "word count", description: "Number of words to type in word mode", category: "test", values: [10, 25, 50, 100, 200] },
  { key: "punctuation", label: "punctuation", description: "Include punctuation marks in the test text", category: "test", values: [false, true], format: boolFormat },
  { key: "numbers", label: "numbers", description: "Include numbers in the test text", category: "test", values: [false, true], format: boolFormat },

  // Behavior
  { key: "difficulty", label: "difficulty", description: "Expert fails on incorrect word, master fails on any mistake", category: "behavior", values: ["normal", "expert", "master"] },
  { key: "blindMode", label: "blind mode", description: "Hide all indicators of errors while typing", category: "behavior", values: [false, true], format: boolFormat },
  { key: "lazyMode", label: "lazy mode", description: "Accept accent characters as their base letter", category: "behavior", values: [false, true], format: boolFormat },
  { key: "freedomMode", label: "freedom mode", description: "Allow going back to previous words to fix errors", category: "behavior", values: [false, true], format: boolFormat },
  { key: "confidenceMode", label: "confidence mode", description: "Disable backspace (on) or lock after submitting each word (max)", category: "behavior", values: ["off", "on", "max"] },
  { key: "stopOnError", label: "stop on error", description: "Stop cursor on incorrect character or word", category: "behavior", values: ["off", "word", "letter"] },
  { key: "strictSpace", label: "strict space", description: "Count extra spaces as errors", category: "behavior", values: [false, true], format: boolFormat },
  { key: "quickEnd", label: "quick end", description: "End the test when the last word is correct without pressing space", category: "behavior", values: [false, true], format: boolFormat },
  { key: "quickRestart", label: "quick restart", description: "Press a key to quickly restart the test", category: "behavior", values: ["off", "tab", "esc", "enter"] },
  { key: "indicateTypos", label: "indicate typos", description: "Show typos below the text or replace characters inline", category: "behavior", values: ["off", "below", "replace"] },
  { key: "hideExtraLetters", label: "hide extra letters", description: "Hide letters typed beyond the expected word length", category: "behavior", values: [false, true], format: boolFormat },
  { key: "keybindingMode", label: "keybinding mode", description: "Navigation style: arrow keys, vim (hjkl), or emacs (C-p/n/b/f)", category: "behavior", values: ["normal", "vim", "emacs"] },

  // Input
  { key: "minWpm", label: "min wpm", description: "Fail the test if speed drops below a minimum WPM threshold", category: "input", values: ["off", "custom"] },
  { key: "minAcc", label: "min accuracy", description: "Fail the test if accuracy drops below a minimum percentage", category: "input", values: ["off", "custom"] },
  { key: "minBurst", label: "min burst", description: "Fail if burst speed drops below threshold (fixed or flexible)", category: "input", values: ["off", "fixed", "flex"] },

  // Caret
  { key: "caretStyle", label: "caret style", description: "Appearance of the typing cursor", category: "caret", values: ["off", "default", "block", "outline", "underline"] },

  // Appearance
  { key: "timerStyle", label: "timer style", description: "How the timer is displayed during the test", category: "appearance", values: ["off", "bar", "text", "mini"] },
  { key: "liveSpeedStyle", label: "live speed", description: "Show live typing speed during the test", category: "appearance", values: ["off", "text", "mini"] },
  { key: "liveAccStyle", label: "live accuracy", description: "Show live accuracy percentage during the test", category: "appearance", values: ["off", "text", "mini"] },
  { key: "liveBurstStyle", label: "live burst", description: "Show live burst speed during the test", category: "appearance", values: ["off", "text", "mini"] },
  { key: "highlightMode", label: "highlight mode", description: "Highlight upcoming words to help with reading ahead", category: "appearance", values: ["off", "letter", "word", "next_word", "next_two_words", "next_three_words"] },
  { key: "typedEffect", label: "typed effect", description: "What happens to words after you type them", category: "appearance", values: ["keep", "fade", "hide"] },
  { key: "tapeMode", label: "tape mode", description: "Scroll the text like a tape instead of wrapping lines", category: "appearance", values: ["off", "letter", "word"] },
  { key: "typingSpeedUnit", label: "speed unit", description: "Unit for displaying typing speed", category: "appearance", values: ["wpm", "cpm", "wps", "cps", "wph"] },
  { key: "showAverage", label: "show average", description: "Display your all-time average speed or accuracy", category: "appearance", values: ["off", "speed", "acc", "both"] },
  { key: "showKeyTips", label: "show key tips", description: "Show keyboard shortcut hints on the main screen", category: "appearance", values: [false, true], format: boolFormat },
  { key: "capsLockWarning", label: "caps lock warning", description: "Warn when caps lock is active during typing", category: "appearance", values: [false, true], format: boolFormat },
];

const CATEGORIES = ["test", "behavior", "input", "caret", "appearance", "theme"] as const;

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  test: "Configure the type, length, and content of your typing tests",
  behavior: "Control how the test reacts to your input and mistakes",
  input: "Set fail conditions based on minimum speed or accuracy",
  caret: "Customize the appearance of your typing cursor",
  appearance: "Adjust the display of timers, stats, and visual effects",
  theme: "Choose a color theme for the interface",
};

interface SettingsScreenProps {
  config: GameConfig;
  onSave: (config: GameConfig) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  config,
  onSave,
  onBack,
}) => {
  const { columns, rows } = useTerminalSize();
  const [editConfig, setEditConfig] = useState<GameConfig>({ ...config });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [categoryIdx, setCategoryIdx] = useState(0);

  // Use theme from the live editConfig so preview updates as user changes theme
  const colors = useTheme(editConfig.theme);

  const themeNames = useMemo(() => getThemeNames(), []);
  const languages = useMemo(() => listAvailableLanguages(), []);

  // Build full settings list including dynamic theme/language
  const allSettings = useMemo(() => {
    const themeItem: SettingItem = {
      key: "theme",
      label: "theme",
      description: "Color theme applied to the entire interface",
      category: "theme",
      values: themeNames,
    };
    const langItem: SettingItem = {
      key: "language",
      label: "language",
      description: "Word list language for the typing test",
      category: "test",
      values: languages.length > 0 ? languages : ["english"],
    };
    return [...SETTINGS.slice(0, 1), langItem, ...SETTINGS.slice(1), themeItem];
  }, [themeNames, languages]);

  const currentCategory = CATEGORIES[categoryIdx]!;

  const filteredSettings = useMemo(
    () => allSettings.filter((s) => s.category === currentCategory),
    [allSettings, currentCategory],
  );

  // Clamp selected index to filtered settings
  const clampedIdx = Math.min(selectedIdx, filteredSettings.length - 1);

  useInput((input, key) => {
    const action = mapNavAction(input, key, editConfig.keybindingMode);

    if (action === "back") {
      onSave(editConfig);
      onBack();
      return;
    }

    if (action === "tab") {
      setCategoryIdx((i) => (i + 1) % CATEGORIES.length);
      setSelectedIdx(0);
      return;
    }

    if (action === "up") {
      setSelectedIdx((i) => Math.max(0, i - 1));
    }

    if (action === "down") {
      setSelectedIdx((i) => Math.min(filteredSettings.length - 1, i + 1));
    }

    if (action === "left" || action === "right") {
      const setting = filteredSettings[clampedIdx];
      if (!setting) return;
      const currentVal = editConfig[setting.key];
      const values = setting.values;
      const currentIdx = values.indexOf(currentVal as never);
      const dir = action === "right" ? 1 : -1;
      const newIdx = Math.max(0, Math.min(values.length - 1, currentIdx + dir));
      const newVal = values[newIdx];

      setEditConfig((prev) => ({
        ...prev,
        [setting.key]: newVal,
      }));
    }

    if (action === "confirm") {
      const setting = filteredSettings[clampedIdx];
      if (!setting) return;
      const currentVal = editConfig[setting.key];
      const values = setting.values;
      const currentIdx = values.indexOf(currentVal as never);
      const nextIdx = (currentIdx + 1) % values.length;
      const newVal = values[nextIdx];

      setEditConfig((prev) => ({
        ...prev,
        [setting.key]: newVal,
      }));
    }
  });

  const contentWidth = Math.min(columns - 4, 70);
  // Cap list height so the panel stays compact and centered
  const listHeight = Math.min(14, Math.max(5, rows - 16));

  // Scrolling: ensure selected item is visible
  const scrollOffset = Math.min(
    Math.max(0, clampedIdx - listHeight + 3),
    Math.max(0, filteredSettings.length - listHeight),
  );

  const selectedSetting = filteredSettings[clampedIdx];
  const labelColWidth = filteredSettings.length > 0
    ? Math.max(...filteredSettings.map((s) => s.label.length)) + 2
    : 0;

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
    >
      {/* Top spacer */}
      <Box flexGrow={1} />

      {/* Center content */}
      <Box
        flexDirection="column"
        alignItems="center"
        width={contentWidth}
        gap={1}
      >
        {/* Title */}
        <Text bold color={colors.main}>settings</Text>

        {/* Category tabs */}
        <Box gap={1} justifyContent="center">
          {CATEGORIES.map((cat, i) => (
            <Text
              key={cat}
              {...(i === categoryIdx
                ? { color: colors.main, bold: true, underline: true }
                : { color: colors.sub })}
            >
              {cat}
            </Text>
          ))}
        </Box>

        {/* Category description */}
        <Text color={colors.sub} dimColor>{CATEGORY_DESCRIPTIONS[currentCategory]}</Text>

        {/* Separator */}
        <Text color={colors.sub} dimColor>{"─".repeat(Math.min(contentWidth, 50))}</Text>

        {/* Settings list - fixed height */}
        <Box flexDirection="column" width={contentWidth} height={listHeight}>
          {filteredSettings.slice(scrollOffset, scrollOffset + listHeight).map((setting, displayIdx) => {
            const actualIdx = scrollOffset + displayIdx;
            const isSelected = actualIdx === clampedIdx;
            const currentVal = editConfig[setting.key];
            const displayVal = setting.format
              ? setting.format(currentVal as string | number | boolean)
              : String(currentVal);

            return (
              <Box key={setting.key} justifyContent="space-between" width={contentWidth}>
                <Box>
                  <Text color={isSelected ? colors.main : colors.sub}>
                    {isSelected ? "▸ " : "  "}
                  </Text>
                  <Text
                    bold={isSelected}
                    color={isSelected ? colors.text : colors.sub}
                  >
                    {setting.label.padEnd(labelColWidth)}
                  </Text>
                </Box>
                <Text color={colors.main} bold={isSelected}>{displayVal}</Text>
              </Box>
            );
          })}
        </Box>

        {/* Scroll indicator */}
        <Box justifyContent="center" height={1}>
          {filteredSettings.length > listHeight ? (
            <Text color={colors.sub}>
              {scrollOffset > 0 ? "\u25B2 " : "  "}
              {clampedIdx + 1}/{filteredSettings.length}
              {scrollOffset + listHeight < filteredSettings.length ? " \u25BC" : "  "}
            </Text>
          ) : (
            <Text> </Text>
          )}
        </Box>

        {/* Separator */}
        <Text color={colors.sub} dimColor>{"─".repeat(Math.min(contentWidth, 50))}</Text>

        {/* Selected setting description */}
        <Box justifyContent="center" height={2} alignItems="center">
          {selectedSetting && (
            <Text color={colors.sub} italic>{selectedSetting.description}</Text>
          )}
        </Box>

        {/* Value options for current setting */}
        <Box justifyContent="center" gap={1} height={1}>
          {selectedSetting && selectedSetting.values.map((v) => {
            const currentVal = editConfig[selectedSetting.key];
            const isActive = v === currentVal;
            const format = selectedSetting.format;
            const display = format ? format(v) : String(v);
            return (
              <Text
                key={`${selectedSetting.key}-${String(v)}`}
                {...(isActive
                  ? { color: colors.main, bold: true, underline: true }
                  : { color: colors.sub })}
              >
                {display}
              </Text>
            );
          })}
        </Box>
      </Box>

      {/* Bottom spacer */}
      <Box flexGrow={1} />

      {/* Navigation help — pinned to bottom, matching MenuScreen pattern */}
      <Box flexDirection="column" alignItems="center" marginBottom={1} gap={0}>
        <Box gap={2} marginTop={1}>
          <Text color={colors.sub}>tab: category</Text>
          <Text color={colors.sub}>
            {editConfig.keybindingMode === "vim"
              ? "hjkl: navigate"
              : editConfig.keybindingMode === "emacs"
                ? "C-p/n/b/f: navigate"
                : "arrows: navigate"}
          </Text>
          <Text color={colors.sub}>enter: cycle</Text>
          <Text color={colors.sub}>
            {editConfig.keybindingMode === "vim"
              ? "q: save & back"
              : editConfig.keybindingMode === "emacs"
                ? "C-g: save & back"
                : "esc: save & back"}
          </Text>
          <Text color={colors.sub}>{process.platform === "darwin" ? "cmd+c" : "ctrl+c"} quit</Text>
        </Box>
      </Box>
    </Box>
  );
};
