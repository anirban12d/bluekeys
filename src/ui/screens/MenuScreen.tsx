import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { GameConfig, GameMode, QuoteLength } from "../../engine/types.js";
import { DEFAULT_CONFIG, TIME_LIMITS, WORD_COUNTS, QUOTE_LENGTHS, CODE_LANGUAGES, CLI_CATEGORIES, SNIPPET_LENGTHS, COMMAND_LENGTHS } from "../../config/difficulty.js";
import { listAvailableLanguages } from "../../constants/languages/index.js";
import { FUNBOX_LIST } from "../../constants/funbox/index.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { useTheme } from "../hooks/useTheme.js";
import { mapNavAction } from "../../input/navigationKeys.js";
import { Logo } from "../components/Logo.js";

const MODES: GameMode[] = ["time", "words", "quote", "code", "cli", "zen", "custom"];

interface MenuScreenProps {
  onStart: (config: GameConfig) => void;
  onSettings?: () => void;
  onCustomText?: () => void;
  initialConfig?: GameConfig;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onStart,
  onSettings,
  onCustomText,
  initialConfig,
}) => {
  const { columns, rows } = useTerminalSize();
  const colors = useTheme(initialConfig?.theme ?? "serika_dark");

  const languages = listAvailableLanguages();
  if (languages.length === 0) languages.push("english");

  const [mode, setMode] = useState<GameMode>(initialConfig?.mode ?? "time");
  const [timeLimitIdx, setTimeLimitIdx] = useState(() => {
    const tl = initialConfig?.timeLimit ?? 30;
    const idx = TIME_LIMITS.indexOf(tl as typeof TIME_LIMITS[number]);
    return idx >= 0 ? idx : 1;
  });
  const [wordCountIdx, setWordCountIdx] = useState(() => {
    const wc = initialConfig?.wordCount ?? 50;
    const idx = WORD_COUNTS.indexOf(wc as typeof WORD_COUNTS[number]);
    return idx >= 0 ? idx : 2;
  });
  const [quoteLengthIdx, setQuoteLengthIdx] = useState(1);
  const [codeLangIdx, setCodeLangIdx] = useState(() => {
    const lang = initialConfig?.codeLanguage ?? "python";
    const idx = CODE_LANGUAGES.indexOf(lang as typeof CODE_LANGUAGES[number]);
    return idx >= 0 ? idx : 0;
  });
  const [snippetLengthIdx, setSnippetLengthIdx] = useState(1);
  const [cliCategoryIdx, setCliCategoryIdx] = useState(() => {
    const cat = initialConfig?.cliCategory ?? "general";
    const idx = CLI_CATEGORIES.indexOf(cat as typeof CLI_CATEGORIES[number]);
    return idx >= 0 ? idx : 0;
  });
  const [commandLengthIdx, setCommandLengthIdx] = useState(1);
  const [punctuation, setPunctuation] = useState(initialConfig?.punctuation ?? false);
  const [numbers, setNumbers] = useState(initialConfig?.numbers ?? false);
  const [languageIdx, setLanguageIdx] = useState(() => {
    const initLang = initialConfig?.language ?? "english";
    const idx = languages.indexOf(initLang);
    return idx >= 0 ? idx : 0;
  });
  const [funboxIdx, setFunboxIdx] = useState(() => {
    const initFb = initialConfig?.funbox?.[0] ?? "none";
    const idx = FUNBOX_LIST.findIndex((f) => f.name === initFb);
    return idx >= 0 ? idx : 0;
  });

  // Row navigation: 0=start, 1=mode, 2=sub-options, 3=toggles, 4=funbox, 5=language, 6=settings
  const [row, setRow] = useState(0);

  const maxRow = onSettings ? 6 : 5;

  const keybindingMode = initialConfig?.keybindingMode ?? "normal";

  useInput((input, key) => {
    const action = mapNavAction(input, key, keybindingMode);

    if (action === "up") setRow((r) => Math.max(0, r - 1));
    if (action === "down") setRow((r) => Math.min(maxRow, r + 1));

    if (action === "left" || action === "right") {
      const dir = action === "right" ? 1 : -1;
      if (row === 1) {
        setMode((m) => {
          const idx = MODES.indexOf(m);
          const next = (idx + dir + MODES.length) % MODES.length;
          return MODES[next]!;
        });
      } else if (row === 2) {
        if (mode === "time") {
          setTimeLimitIdx((i) => Math.max(0, Math.min(TIME_LIMITS.length - 1, i + dir)));
        } else if (mode === "words") {
          setWordCountIdx((i) => Math.max(0, Math.min(WORD_COUNTS.length - 1, i + dir)));
        } else if (mode === "quote") {
          setQuoteLengthIdx((i) => Math.max(0, Math.min(QUOTE_LENGTHS.length - 1, i + dir)));
        } else if (mode === "code") {
          setCodeLangIdx((i) => (i + dir + CODE_LANGUAGES.length) % CODE_LANGUAGES.length);
        } else if (mode === "cli") {
          setCliCategoryIdx((i) => (i + dir + CLI_CATEGORIES.length) % CLI_CATEGORIES.length);
        }
      } else if (row === 3) {
        if (mode === "code") {
          setSnippetLengthIdx((i) => Math.max(0, Math.min(SNIPPET_LENGTHS.length - 1, i + dir)));
        } else if (mode === "cli") {
          setCommandLengthIdx((i) => Math.max(0, Math.min(COMMAND_LENGTHS.length - 1, i + dir)));
        } else {
          if (dir === -1) {
            setPunctuation((p) => !p);
          } else {
            setNumbers((n) => !n);
          }
        }
      } else if (row === 4) {
        setFunboxIdx((i) => (i + dir + FUNBOX_LIST.length) % FUNBOX_LIST.length);
      } else if (row === 5) {
        setLanguageIdx((i) => Math.max(0, Math.min(languages.length - 1, i + dir)));
      }
    }

    if (action === "confirm") {
      if (row === 0) {
        if (mode === "custom" && onCustomText) {
          onCustomText();
          return;
        }

        const selectedFunbox = FUNBOX_LIST[funboxIdx]!;
        const isCodeOrCli = mode === "code" || mode === "cli";
        const config: GameConfig = {
          ...DEFAULT_CONFIG,
          ...(initialConfig ?? {}),
          mode,
          timeLimit: TIME_LIMITS[timeLimitIdx]!,
          wordCount: WORD_COUNTS[wordCountIdx]!,
          quoteLength: mode === "code"
            ? [SNIPPET_LENGTHS[snippetLengthIdx]!.value as QuoteLength]
            : mode === "cli"
              ? [COMMAND_LENGTHS[commandLengthIdx]!.value as QuoteLength]
              : [QUOTE_LENGTHS[quoteLengthIdx]!.value as QuoteLength],
          language: languages[languageIdx] ?? "english",
          punctuation: isCodeOrCli ? false : (selectedFunbox.disablesPunctuation ? false : punctuation),
          numbers: isCodeOrCli ? false : (selectedFunbox.disablesNumbers ? false : numbers),
          funbox: [selectedFunbox.name],
          codeLanguage: CODE_LANGUAGES[codeLangIdx]!,
          cliCategory: CLI_CATEGORIES[cliCategoryIdx]!,
        };
        onStart(config);
        return;
      }

      if (row === maxRow && onSettings) {
        onSettings();
        return;
      }
    }

    // Direct shortcuts (only in normal mode — in vim mode these keys navigate)
    if (keybindingMode === "normal") {
      if (input === "p" && row === 3) setPunctuation((p) => !p);
      if (input === "n" && row === 3) setNumbers((n) => !n);
    }
  });

  // Sub-options rendering
  let subOptions: React.ReactNode = null;
  if (mode === "time") {
    subOptions = (
      <Box gap={2} justifyContent="center">
        {TIME_LIMITS.map((val, i) => (
          <Text
            key={`time-${i}`}
            {...(row === 2 && i === timeLimitIdx
              ? { inverse: true }
              : i === timeLimitIdx
                ? { color: colors.main }
                : { color: colors.sub })}
          >
            {val}
          </Text>
        ))}
      </Box>
    );
  } else if (mode === "words") {
    subOptions = (
      <Box gap={2} justifyContent="center">
        {WORD_COUNTS.map((val, i) => (
          <Text
            key={`words-${i}`}
            {...(row === 2 && i === wordCountIdx
              ? { inverse: true }
              : i === wordCountIdx
                ? { color: colors.main }
                : { color: colors.sub })}
          >
            {val}
          </Text>
        ))}
      </Box>
    );
  } else if (mode === "quote") {
    subOptions = (
      <Box gap={2} justifyContent="center">
        {QUOTE_LENGTHS.map((q, i) => (
          <Text
            key={`quote-${i}`}
            {...(row === 2 && i === quoteLengthIdx
              ? { inverse: true }
              : i === quoteLengthIdx
                ? { color: colors.main }
                : { color: colors.sub })}
          >
            {q.label}
          </Text>
        ))}
      </Box>
    );
  } else if (mode === "code") {
    subOptions = (
      <Box flexDirection="column" alignItems="center" gap={0}>
        <Box gap={2} justifyContent="center">
          {CODE_LANGUAGES.map((lang, i) => (
            <Text
              key={`code-${i}`}
              {...(row === 2 && i === codeLangIdx
                ? { inverse: true }
                : i === codeLangIdx
                  ? { color: colors.main }
                  : { color: colors.sub })}
            >
              {lang}
            </Text>
          ))}
        </Box>
        <Box gap={2} justifyContent="center">
          {SNIPPET_LENGTHS.map((sl, i) => (
            <Text
              key={`slen-${i}`}
              {...(row === 3 && i === snippetLengthIdx
                ? { inverse: true }
                : i === snippetLengthIdx
                  ? { color: colors.main }
                  : { color: colors.sub })}
            >
              {sl.label}
            </Text>
          ))}
        </Box>
      </Box>
    );
  } else if (mode === "cli") {
    subOptions = (
      <Box flexDirection="column" alignItems="center" gap={0}>
        <Box gap={2} justifyContent="center">
          {CLI_CATEGORIES.map((cat, i) => (
            <Text
              key={`cli-${i}`}
              {...(row === 2 && i === cliCategoryIdx
                ? { inverse: true }
                : i === cliCategoryIdx
                  ? { color: colors.main }
                  : { color: colors.sub })}
            >
              {cat}
            </Text>
          ))}
        </Box>
        <Box gap={2} justifyContent="center">
          {COMMAND_LENGTHS.map((cl, i) => (
            <Text
              key={`clen-${i}`}
              {...(row === 3 && i === commandLengthIdx
                ? { inverse: true }
                : i === commandLengthIdx
                  ? { color: colors.main }
                  : { color: colors.sub })}
            >
              {cl.label}
            </Text>
          ))}
        </Box>
      </Box>
    );
  } else if (mode === "zen") {
    subOptions = (
      <Box justifyContent="center">
        <Text color={colors.sub}>just type freely</Text>
      </Box>
    );
  } else if (mode === "custom") {
    subOptions = (
      <Box justifyContent="center">
        <Text color={colors.sub}>type your own text</Text>
      </Box>
    );
  }

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box flexGrow={1} />

      <Box
        flexDirection="column"
        alignItems="center"
        gap={1}
      >
        {/* Logo */}
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          <Logo color={colors.main} subColor={colors.sub} terminalWidth={columns} />
          <Box marginTop={1}>
            <Text color={colors.sub}>terminal typing test</Text>
          </Box>
        </Box>

        {/* Start button — row 0, focused by default */}
        <Box marginBottom={1} justifyContent="center">
          <Text
            {...(row === 0
              ? { inverse: true, bold: true }
              : { color: colors.main })}
          >
            {mode === "custom" ? "  set text  " : "  start  "}
          </Text>
        </Box>

        {/* Mode selection — row 1 */}
        <Box gap={3} justifyContent="center">
          {MODES.map((m) => (
            <Text
              key={m}
              {...(m === mode
                ? (row === 1
                  ? { inverse: true }
                  : { color: colors.main })
                : { color: colors.sub })}
            >
              {m}
            </Text>
          ))}
        </Box>

        {/* Sub-options — row 2 */}
        {subOptions}

        {/* Toggles: punctuation & numbers — row 3 (hidden for code/cli) */}
        {mode !== "code" && mode !== "cli" && (
          <Box gap={3} justifyContent="center">
            <Text
              {...(punctuation
                ? (row === 3 ? { inverse: true } : { color: colors.main })
                : (row === 3 ? { underline: true, color: colors.sub } : { color: colors.sub }))}
            >
              @ punctuation
            </Text>
            <Text
              {...(numbers
                ? (row === 3 ? { inverse: true } : { color: colors.main })
                : (row === 3 ? { underline: true, color: colors.sub } : { color: colors.sub }))}
            >
              # numbers
            </Text>
          </Box>
        )}

        {/* Funbox selection — row 4 */}
        <Box gap={1} justifyContent="center">
          <Text color={colors.sub}>funbox</Text>
          <Text
            {...(row === 4
              ? { inverse: true }
              : FUNBOX_LIST[funboxIdx]!.name !== "none"
                ? { color: colors.main }
                : { color: colors.sub })}
          >
            {FUNBOX_LIST[funboxIdx]!.label}
          </Text>
          {row === 4 && FUNBOX_LIST[funboxIdx]!.name !== "none" && (
            <Text color={colors.sub} dimColor> - {FUNBOX_LIST[funboxIdx]!.description}</Text>
          )}
        </Box>

        {/* Language selection — row 5 */}
        <Box gap={1} justifyContent="center">
          <Text color={colors.sub}>language</Text>
          <Text
            {...(row === 5
              ? { inverse: true }
              : { color: colors.main })}
          >
            {languages[languageIdx] ?? "english"}
          </Text>
        </Box>

        {/* Settings button — row 6 (maxRow) */}
        {onSettings && (
          <Box justifyContent="center">
            <Text
              {...(row === maxRow
                ? { inverse: true }
                : { color: colors.sub })}
            >
              settings
            </Text>
          </Box>
        )}
      </Box>

      {/* Bottom hints */}
      <Box flexGrow={1} />
      <Box flexDirection="column" alignItems="center" marginBottom={1} gap={0}>
        <Text color={colors.sub} dimColor>
          tip: increase your terminal font size for a better experience
        </Text>
        <Box gap={2} marginTop={1}>
          <Text color={colors.sub}>
            {keybindingMode === "vim"
              ? "enter start  hjkl configure  q back"
              : keybindingMode === "emacs"
                ? "enter start  C-n/p/f/b configure  C-g back"
                : "enter start  arrows configure"}
          </Text>
          <Text color={colors.sub}>{process.platform === "darwin" ? "cmd+c" : "ctrl+c"} quit</Text>
        </Box>
      </Box>
    </Box>
  );
};
