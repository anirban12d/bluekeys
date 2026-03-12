import React, { useState, useCallback } from "react";
import type { GameConfig } from "../engine/types.js";
import { useGame } from "../ui/hooks/useGame.js";
import { GameScreen } from "../ui/screens/GameScreen.js";
import { GameOverScreen } from "../ui/screens/GameOverScreen.js";
import { MenuScreen } from "../ui/screens/MenuScreen.js";
import { SettingsScreen } from "../ui/screens/SettingsScreen.js";
import { CustomTextScreen } from "../ui/screens/CustomTextScreen.js";
import { DEFAULT_CONFIG } from "../config/difficulty.js";
import { loadConfig, saveConfig } from "../state/persistence.js";
import { parseArgs } from "../cli/args.js";

const cliConfig = parseArgs(process.argv.slice(2));

type Screen = "menu" | "game" | "settings" | "customText";

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
