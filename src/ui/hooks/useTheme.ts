import { useMemo } from "react";
import { getTheme } from "../../config/themes.js";
import type { TerminalTheme } from "../../engine/types.js";

export function useTheme(themeName: string): TerminalTheme["colors"] {
  return useMemo(() => getTheme(themeName).colors, [themeName]);
}
