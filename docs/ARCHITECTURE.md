# Architecture

This document explains how the Bluekeys codebase is organized so that new contributors can quickly understand where things live and how they connect.

### Table of Contents

- [Overview](#overview)
- [Directory Map](#directory-map)
- [Engine Layer](#engine-layer)
  - [Game State](#game-state)
  - [Event Model](#event-model)
  - [Reducer Pattern](#reducer-pattern)
  - [Scoring](#scoring)
  - [Error Analysis](#error-analysis)
  - [History Analysis](#history-analysis)
  - [Learning Mode](#learning-mode)
  - [Word Generation](#word-generation)
  - [Timer](#timer)
- [UI Layer](#ui-layer)
  - [Screens](#screens)
  - [Components](#components)
  - [Hooks](#hooks)
- [State Management](#state-management)
- [Input Handling](#input-handling)
- [Configuration and Persistence](#configuration-and-persistence)
- [Data Files](#data-files)
- [Build and Entry Point](#build-and-entry-point)

## Overview

Bluekeys follows a strict **engine/UI separation**:

```
┌─────────────────────────────────────────────┐
│                CLI Entry Point              │
│              src/cli/index.tsx               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              App (Screen Router)             │
│              src/app/App.tsx                 │
└──┬────────┬────────┬─────────┬──────────────┘
   │        │        │         │
 Menu    Game    GameOver   Settings
Screen  Screen   Screen     Screen
   │        │        │         │
   ├── Learn Menu Screen       │
   ├── Lesson Screen           │
   ├── Heatmap Screen          │
   └────────┴────────┴─────────┘
                   │
         ┌─────────▼──────────┐
         │    React Hooks     │
         │  useGame, useTimer │
         │  useKeyboard, etc. │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │   Store (dispatch  │
         │   / subscribe)     │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │   Game Engine      │
         │   (pure logic)     │
         │   gameEngine.ts    │
         │   scoring.ts       │
         │   wordGenerator.ts │
         │   timer.ts         │
         └────────────────────┘
```

The **engine** is pure TypeScript with zero UI dependencies. It can be tested independently with no React or Ink imports. The **UI layer** subscribes to engine state through a lightweight store and dispatches events back.

## Directory Map

| Directory | Purpose |
|---|---|
| `src/engine/` | Pure game logic: state machine, scoring, word generation, timer, error analysis, history analysis, type definitions |
| `src/learn/` | Learning mode: curriculum definitions, lesson generator, keyboard layout data, progress persistence |
| `src/ui/screens/` | Full-screen views: Menu, Game, GameOver, Settings, CustomText, LearnMenu, Lesson, Heatmap |
| `src/ui/components/` | Reusable terminal UI components: WordStream, Cursor, LiveStats, Timer, ProgressBar, StatsPanel, ErrorHeatmap, Keyboard |
| `src/ui/hooks/` | React hooks bridging the engine to Ink: useGame, useKeyboard, useTimer, useTheme, useTerminalSize |
| `src/state/` | Redux-like store (`store.ts`) and config/results persistence (`persistence.ts`) |
| `src/config/` | Default configuration, theme definitions, difficulty settings |
| `src/constants/` | Game content: languages, quotes, and funbox definitions |
| `src/constants/languages/` | Language word lists (JSON data files) and loader logic |
| `src/constants/quotes/` | Quote collections (JSON data files) and loader logic |
| `src/constants/funbox/` | Funbox mode definitions and word transforms |
| `src/input/` | Key normalization (`keyMap.ts`) and navigation keybindings (`navigationKeys.ts`) |
| `src/cli/` | CLI entry point (`index.tsx`) and argument parser (`args.ts`) |
| `src/app/` | Root `App.tsx` component managing screen transitions |
| `src/utils/` | Formatting utilities |
| `tests/` | Vitest unit tests |

## Engine Layer

All files in `src/engine/` are pure functions and types with no framework imports.

### Game State

Defined in `src/engine/types.ts`. The central `GameState` interface holds:

- **`phase`** — current lifecycle stage: `menu`, `ready`, `active`, `finished`, `failed`, `settings`, `customText`. Additional app-level screens (`learn`, `lesson`, `heatmap`) are managed by the App router outside the engine phase.
- **`config`** — the full `GameConfig` with mode, difficulty, display settings, theme, keybindings, funbox, etc.
- **`words`** — the target word list and active word index
- **`input`** — current typed input, history of completed words, missed word tracking
- **`metrics`** — live accuracy, WPM/raw/burst histories, keypress counts, error counts, timing data
- **`timing`** — start/end timestamps and elapsed seconds

### Event Model

The engine is driven by explicit events (discriminated union `GameEvent` in `types.ts`):

| Event | When dispatched |
|---|---|
| `INIT_TEST` | Words are generated and test is ready |
| `START_TEST` | First keystroke begins the test |
| `INSERT_CHAR` | User types a character |
| `DELETE_CHAR` | User presses backspace |
| `DELETE_WORD` | User presses Ctrl+Backspace |
| `TICK` | Timer fires every second |
| `RESTART` | User restarts the test |
| `FINISH` | Test completes (time up or all words typed) |
| `FAIL` | Difficulty/threshold failure |
| `ADD_WORDS` | More words are appended during time mode |
| `SET_CONFIG` | Configuration changes |

### Reducer Pattern

`src/engine/gameEngine.ts` implements a deterministic reducer:

```typescript
function reduce(state: GameState, event: GameEvent): ReducerResult
// Returns { state: GameState, commands: Command[] }
```

The reducer returns **commands** (side-effect intents like `START_TIMER`, `STOP_TIMER`, `GENERATE_WORDS`) that the UI layer executes. This keeps the engine free of async/IO concerns.

### Scoring

`src/engine/scoring.ts` contains pure functions for:

- **WPM/raw WPM** calculation based on correct characters and elapsed time
- **Accuracy** — correct keystrokes vs total keystrokes
- **Consistency** — standard deviation of per-second WPM values
- **Character counts** — correct, incorrect, extra, missed, spaces
- **Final result assembly** — builds the `FinalResult` object with all stats

### Error Analysis

`src/engine/errorAnalysis.ts` analyzes typing errors from completed tests:

- **Per-word error detection** — identifies mistyped characters within each word
- **Character-level diffing** — pinpoints exactly which characters were wrong

### History Analysis

`src/engine/historyAnalysis.ts` aggregates data across all saved results:

- **Most missed words** — ranks words by error frequency across sessions
- **Character confusion pairs** — identifies which characters are commonly swapped (e.g. `h→e`)
- **Accuracy trend** — tracks accuracy over time
- **Practice suggestions** — recommends words to focus on based on error history

### Learning Mode

The `src/learn/` directory contains the touch-typing curriculum system:

| File | Purpose |
|---|---|
| `curriculum.ts` | 25 progressive lessons organized into Beginner, Intermediate, and Advanced levels |
| `keyboard.ts` | Keyboard layout data with finger-to-key assignments |
| `lessonGenerator.ts` | Generates drill text for each lesson (key drills, word practice, mixed reviews) |
| `progress.ts` | Persists per-lesson star ratings and completion state to `~/.bluekeys/learn-progress.json` |

### Word Generation

`src/engine/wordGenerator.ts` handles generating words for each mode:

- **Time mode** — rolling buffer with lookahead, dynamically adds words
- **Words mode** — fixed count of words
- **Quote mode** — selects a random quote and splits into words
- **Custom mode** — user-provided text
- **Zen mode** — no predefined words

Also applies funbox transformations, punctuation injection, and number insertion.

### Timer

`src/engine/timer.ts` manages the test timer:

- Starts on first keystroke
- Emits `TICK` events every second
- Handles time-up detection for timed tests

## UI Layer

Built with [Ink](https://github.com/vadimdemedes/ink), a React renderer for terminal interfaces.

### Screens

| Screen | File | Purpose |
|---|---|---|
| Menu | `screens/MenuScreen.tsx` | Mode selection, language, settings navigation |
| Game | `screens/GameScreen.tsx` | Active typing test with word stream, timer, live stats |
| Game Over | `screens/GameOverScreen.tsx` | Results display with WPM, accuracy, character breakdown, per-second chart |
| Settings | `screens/SettingsScreen.tsx` | Full configuration UI |
| Custom Text | `screens/CustomTextScreen.tsx` | Text input for custom mode |
| Learn Menu | `screens/LearnMenuScreen.tsx` | Learning mode curriculum browser with lesson selection and star ratings |
| Lesson | `screens/LessonScreen.tsx` | Active lesson with keyboard visualization and typing drills |
| Heatmap | `screens/HeatmapScreen.tsx` | Cross-session error analysis with overview, missed words, character mistakes, accuracy trend, and practice suggestions |

Screen transitions are managed by `App.tsx` based on the current `GamePhase`.

### Components

| Component | Purpose |
|---|---|
| `WordStream` | Renders the word list with per-character highlighting (correct, incorrect, extra, untyped) |
| `Cursor` | Visual caret indicator (block, outline, underline styles) |
| `LiveStats` | Real-time WPM, accuracy, burst display |
| `Timer` | Time remaining or elapsed |
| `ProgressBar` | Visual progress indicator |
| `StatsPanel` | Stats panel for the game over screen |
| `ErrorHeatmap` | Per-test error heatmap showing mistyped words with character-level coloring |
| `Keyboard` | Visual keyboard layout with color-coded finger assignments for learning mode |

### Hooks

| Hook | Purpose |
|---|---|
| `useGame` | Initializes the store, manages word generation, bridges engine state to React |
| `useKeyboard` | Captures raw keyboard input via Ink's `useInput` and dispatches engine events |
| `useTimer` | Manages the 1-second tick loop |
| `useTheme` | Resolves the current theme's color palette |
| `useTerminalSize` | Tracks terminal dimensions for responsive layout |

## State Management

`src/state/store.ts` implements a minimal Redux-like store:

- **`dispatch(event)`** — feeds events into the engine reducer
- **`getState()`** — returns current `GameState`
- **`subscribe(listener)`** — notifies UI of state changes

The store is the single bridge between the engine and the UI. Components never mutate game state directly.

## Input Handling

- `src/input/keyMap.ts` — normalizes Ink key events into canonical key names
- `src/input/navigationKeys.ts` — defines keybindings for menu navigation across normal, vim, and emacs modes

During an active test, all printable character keys dispatch `INSERT_CHAR` events. Navigation keys (arrows, vim motions, etc.) only work in menus/settings, never during typing.

## Configuration and Persistence

`src/state/persistence.ts` handles all file I/O:

| File | Format | Purpose |
|---|---|---|
| `~/.bluekeys/config.toml` | TOML | User configuration (fully commented, generated on first run) |
| `~/.bluekeys/pb.json` | JSON | Personal best records per mode/config combination |
| `~/.bluekeys/results.ndjson` | NDJSON | Full result history (one JSON object per line) |
| `~/.bluekeys/learn-progress.json` | JSON | Learning mode star ratings and lesson completion |

On Windows, `~/.bluekeys/` is replaced with `%APPDATA%\.bluekeys\`.

The default configuration lives in `src/config/difficulty.ts` as `DEFAULT_CONFIG`. When the user's config file is loaded, it is merged with defaults so that new settings added in future versions are always present.

## Data Files

Game content (languages, quotes, funbox) lives in `src/constants/`:

```
src/constants/
├── languages/
│   ├── index.ts              # Language loader and cache
│   ├── words.json            # Fallback word list (~10k English words)
│   └── data/
│       ├── english.json
│       ├── english_1k.json
│       ├── french.json
│       ├── german.json
│       ├── spanish.json
│       ├── code_python.json
│       └── code_javascript.json
├── quotes/
│   ├── index.ts              # Quote loader and random selection
│   └── data/
│       └── english.json
└── funbox/
    └── index.ts              # Funbox definitions and word transforms
```

Each language file is a JSON object with `name`, `orderedByFrequency`, and `words` fields. Quote files contain `language`, `groups`, and `quotes` arrays. See [LANGUAGES.md](./LANGUAGES.md) for the full format.

## Build and Entry Point

- **Entry**: `src/cli/index.tsx` — parses CLI arguments, loads config, creates the Ink app
- **Argument parsing**: `src/cli/args.ts` — handles `--mode`, `--time`, `--theme`, etc.
- **Build**: `pnpm build` runs `tsc` and copies data files to `dist/`
- **Dev**: `pnpm dev` runs the source directly via `tsx`
- **Output**: `dist/cli/index.js` is the compiled entry point and the `bin` target for `npm install -g`
