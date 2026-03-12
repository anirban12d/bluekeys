# Adding Themes

This guide walks you through adding a new terminal theme to Bluekeys.

### Table of Contents

- [Overview](#overview)
- [Creating a Theme](#creating-a-theme)
- [Color Properties](#color-properties)
- [Testing Your Theme](#testing-your-theme)
- [Submitting](#submitting)
- [Theme Guidelines](#theme-guidelines)

## Overview

Bluekeys themes are defined in `src/config/themes.ts` as an array of `TerminalTheme` objects. Each theme maps semantic color roles to hex color values.

## Creating a Theme

1. Pick a name for your theme. It must be **lowercase** with **underscores** replacing spaces (e.g., `my_theme`).

2. Open `src/engine/types.ts` and verify the `TerminalTheme` interface — your theme must provide all required color properties.

3. Open `src/config/themes.ts` and add a new entry to the **end** of the `THEMES` array:

   ```typescript
   {
     name: "my_theme",
     colors: {
       bg: "#1e1e2e",
       main: "#cba6f7",
       caret: "#f5e0dc",
       sub: "#6c7086",
       subAlt: "#181825",
       text: "#cdd6f4",
       error: "#f38ba8",
       errorExtra: "#9a5768",
       colorfulError: "#f38ba8",
       colorfulErrorExtra: "#9a5768",
     },
   },
   ```

## Color Properties

| Property | Used for |
|---|---|
| `bg` | Terminal background color |
| `main` | Primary accent color (active elements, highlights) |
| `caret` | Cursor/caret color |
| `sub` | Secondary text (untyped words, labels) |
| `subAlt` | Alternate secondary (subtle backgrounds, borders) |
| `text` | Primary text color (typed text, results) |
| `error` | Incorrect character highlight |
| `errorExtra` | Extra (overflow) character highlight |
| `colorfulError` | Error color when colorful mode is enabled |
| `colorfulErrorExtra` | Extra error color when colorful mode is enabled |

## Testing Your Theme

1. Run the app in dev mode:
   ```bash
   pnpm dev
   ```

2. Navigate to Settings and select your theme, or launch directly:
   ```bash
   pnpm dev -- --theme my_theme
   ```

3. Verify readability with these combinations:
   - Default settings
   - With `flipTestColors` enabled
   - With `colorfulMode` enabled
   - Both enabled together

4. Run the test suite to ensure your theme is valid:
   ```bash
   pnpm test
   ```

## Submitting

1. Create a branch: `git checkout -b feat/theme-my-theme`
2. Commit your change with a message like: `feat(themes): add my_theme theme`
3. Open a pull request with a screenshot of your theme in action.

## Theme Guidelines

- Your theme must be **visually distinct** from all existing themes.
- **Text must be readable** against the background — avoid low-contrast combinations.
- The `error` color must be clearly distinguishable from `text` and `main`.
- Test with a full typing session to ensure nothing is hard to read during actual use.
