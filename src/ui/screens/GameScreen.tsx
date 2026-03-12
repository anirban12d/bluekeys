import React from "react";
import { Box, Text } from "ink";
import type { GameState, GameEvent } from "../../engine/types.js";
import { WordStream } from "../components/WordStream.js";
import { LiveStats } from "../components/LiveStats.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { useTheme } from "../hooks/useTheme.js";

interface GameScreenProps {
  state: GameState;
  dispatch: (event: GameEvent) => void;
  onRestart: () => void;
  onMenu?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  state,
  dispatch,
  onRestart,
  onMenu,
}) => {
  const { columns, rows } = useTerminalSize();
  const colors = useTheme(state.config.theme);
  const isActive = state.phase === "ready" || state.phase === "active";
  const { config } = state;
  const noQuit = config.funbox.includes("no_quit");

  useKeyboard(
    dispatch,
    isActive,
    noQuit ? undefined : onRestart,
    noQuit ? undefined : onMenu,
    config.quickRestart,
  );

  const contentWidth = Math.min(columns - 8, 60);

  // Timer / progress display
  const isTimeMode = config.mode === "time";
  const isWordsMode = config.mode === "words" || config.mode === "quote" || config.mode === "custom";

  let progressText = "";
  if (isTimeMode && state.phase === "active") {
    const remaining = Math.max(0, config.timeLimit - state.timing.elapsedSeconds);
    progressText = `${remaining}`;
  } else if (isWordsMode) {
    progressText = `${state.words.activeWordIndex}/${state.words.words.length}`;
  } else if (config.mode === "zen" && state.phase === "active") {
    progressText = `${state.timing.elapsedSeconds}`;
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
        width={contentWidth}
      >
        {/* Timer / progress counter */}
        {progressText.length > 0 && (
          <Box marginBottom={1}>
            <Text color={colors.main} bold>{progressText}</Text>
          </Box>
        )}

        {/* Word stream - exactly 3 lines */}
        <WordStream state={state} width={contentWidth} />

        {/* Live stats (shown during active phase) */}
        {state.phase === "active" && (
          <Box marginTop={1}>
            <LiveStats state={state} />
          </Box>
        )}
      </Box>

      {/* Bottom spacer with hints */}
      <Box flexGrow={1} />
      <Box marginBottom={1} gap={3}>
        {state.phase === "ready" && (
          <Text color={colors.sub}>start typing...</Text>
        )}
        <Text color={colors.sub} dimColor>{process.platform === "darwin" ? "cmd+c" : "ctrl+c"} quit</Text>
      </Box>
    </Box>
  );
};
