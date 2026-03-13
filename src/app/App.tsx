import React, { useState, useCallback } from "react";
import type { GameConfig } from "../engine/types.js";
import { useGame } from "../ui/hooks/useGame.js";
import { GameScreen } from "../ui/screens/GameScreen.js";
import { GameOverScreen } from "../ui/screens/GameOverScreen.js";
import { MenuScreen } from "../ui/screens/MenuScreen.js";
import { SettingsScreen } from "../ui/screens/SettingsScreen.js";
import { CustomTextScreen } from "../ui/screens/CustomTextScreen.js";
import { HeatmapScreen } from "../ui/screens/HeatmapScreen.js";
import { LearnMenuScreen } from "../ui/screens/LearnMenuScreen.js";
import { LessonScreen } from "../ui/screens/LessonScreen.js";
import { getAllLessons } from "../learn/curriculum.js";
import { DEFAULT_CONFIG } from "../config/difficulty.js";
import { loadConfig, saveConfig } from "../state/persistence.js";
import { parseArgs } from "../cli/args.js";

const cliConfig = parseArgs(process.argv.slice(2));

type Screen = "menu" | "game" | "settings" | "customText" | "heatmap" | "learn" | "lesson";

export const App: React.FC = () => {
  const [config, setConfig] = useState<GameConfig>(() => {
    if (cliConfig) return cliConfig;
    try {
      return loadConfig();
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const [screen, setScreen] = useState<Screen>(cliConfig ? "game" : "menu");
  const [gameKey, setGameKey] = useState(0);
  const [_repeatMode, setRepeatMode] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  const handleRestart = useCallback(() => {
    setRepeatMode(false);
    setGameKey((k) => k + 1);
  }, []);

  const handleRepeat = useCallback(() => {
    setRepeatMode(true);
    setGameKey((k) => k + 1);
  }, []);

  const handleMenu = useCallback(() => {
    setScreen("menu");
    setRepeatMode(false);
  }, []);

  const handleStartFromMenu = useCallback((cfg: GameConfig) => {
    setConfig(cfg);
    setScreen("game");
    setRepeatMode(false);
    setGameKey((k) => k + 1);
  }, []);

  const handleSettings = useCallback(() => {
    setScreen("settings");
  }, []);

  const handleHeatmap = useCallback(() => {
    setScreen("heatmap");
  }, []);

  const handleBackFromHeatmap = useCallback(() => {
    setScreen("menu");
  }, []);

  const handleLearn = useCallback(() => {
    setScreen("learn");
  }, []);

  const handleBackFromLearn = useCallback(() => {
    setScreen("menu");
  }, []);

  const handleStartLesson = useCallback((lessonId: string) => {
    setCurrentLessonId(lessonId);
    setScreen("lesson");
  }, []);

  const handleBackFromLesson = useCallback(() => {
    setScreen("learn");
  }, []);

  const handleNextLesson = useCallback(() => {
    if (!currentLessonId) return;
    const allLessons = getAllLessons();
    const idx = allLessons.findIndex((l) => l.id === currentLessonId);
    if (idx >= 0 && idx < allLessons.length - 1) {
      setCurrentLessonId(allLessons[idx + 1]!.id);
      // Force re-render by changing key
      setGameKey((k) => k + 1);
    } else {
      setScreen("learn");
    }
  }, [currentLessonId]);

  const handleCustomText = useCallback(() => {
    setScreen("customText");
  }, []);

  const handleSaveSettings = useCallback((cfg: GameConfig) => {
    setConfig(cfg);
    try {
      saveConfig(cfg);
    } catch {
      // Silently fail on save errors
    }
  }, []);

  const handleBackFromSettings = useCallback(() => {
    setScreen("menu");
  }, []);

  const handleStartFromCustom = useCallback((cfg: GameConfig) => {
    setConfig(cfg);
    setScreen("game");
    setRepeatMode(false);
    setGameKey((k) => k + 1);
  }, []);

  const handleBackFromCustom = useCallback(() => {
    setScreen("menu");
  }, []);

  if (screen === "menu") {
    return (
      <MenuScreen
        onStart={handleStartFromMenu}
        onSettings={handleSettings}
        onHeatmap={handleHeatmap}
        onLearn={handleLearn}
        onCustomText={handleCustomText}
        initialConfig={config}
      />
    );
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        config={config}
        onSave={handleSaveSettings}
        onBack={handleBackFromSettings}
      />
    );
  }

  if (screen === "learn") {
    return (
      <LearnMenuScreen
        theme={config.theme}
        keybindingMode={config.keybindingMode}
        onBack={handleBackFromLearn}
        onStartLesson={handleStartLesson}
      />
    );
  }

  if (screen === "lesson" && currentLessonId) {
    return (
      <LessonScreen
        key={`${currentLessonId}-${gameKey}`}
        lessonId={currentLessonId}
        theme={config.theme}
        keybindingMode={config.keybindingMode}
        onBack={handleBackFromLesson}
        onNext={handleNextLesson}
      />
    );
  }

  if (screen === "heatmap") {
    return (
      <HeatmapScreen
        theme={config.theme}
        keybindingMode={config.keybindingMode}
        onBack={handleBackFromHeatmap}
      />
    );
  }

  if (screen === "customText") {
    return (
      <CustomTextScreen
        config={config}
        onStart={handleStartFromCustom}
        onBack={handleBackFromCustom}
      />
    );
  }

  return (
    <GameInner
      key={gameKey}
      config={config}
      onRestart={handleRestart}
      onRepeat={handleRepeat}
      onMenu={handleMenu}
    />
  );
};

interface GameInnerProps {
  config: GameConfig;
  onRestart: () => void;
  onRepeat: () => void;
  onMenu: () => void;
}

const GameInner: React.FC<GameInnerProps> = ({
  config,
  onRestart,
  onRepeat,
  onMenu,
}) => {
  const { state, dispatch } = useGame(config);

  if (state.phase === "finished" || state.phase === "failed") {
    return (
      <GameOverScreen
        state={state}
        onRestart={onRestart}
        onRepeat={onRepeat}
        onMenu={onMenu}
      />
    );
  }

  return (
    <GameScreen
      state={state}
      dispatch={dispatch}
      onRestart={onRestart}
      onMenu={onMenu}
    />
  );
};
