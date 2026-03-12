# Contributing

Thank you for your interest in contributing to Bluekeys! This guide covers how to get started, how to contribute, and the standards we follow.

### Table of Contents

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Prerequisites](#prerequisites)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
  - [Making Changes](#making-changes)
  - [Running Tests](#running-tests)
  - [Creating a Pull Request](#creating-a-pull-request)
- [Standards and Guidelines](#standards-and-guidelines)
  - [Pull Request Naming](#pull-request-naming)
  - [Theme Guidelines](#theme-guidelines)
  - [Language Guidelines](#language-guidelines)
  - [Funbox Guidelines](#funbox-guidelines)
- [Project Structure](#project-structure)
- [Questions](#questions)

## Getting Started

Bluekeys is a terminal-based typing test built with TypeScript, React, and [Ink](https://github.com/vadimdemedes/ink) (a React renderer for the terminal). The codebase follows a clean separation between the game engine (pure logic) and the UI layer (Ink components). If you're comfortable with TypeScript and React, you'll feel right at home.

For a deeper understanding of how the code is organized, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## How to Contribute

### Prerequisites

- **Node.js** — version 18 or later
- **pnpm** — version 10+ (install with `npm install -g pnpm`)
- **Git**

### Setting Up the Development Environment

1. **Fork the repository** — click the "Fork" button on the [Bluekeys repo](https://github.com/anirban12d/bluekeys).

2. **Clone your fork:**
   ```bash
   git clone https://github.com/<your-username>/bluekeys.git
   cd bluekeys
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Run in development mode:**
   ```bash
   pnpm dev
   ```
   This uses `tsx` to run the TypeScript source directly without a build step.

5. **Build the project:**
   ```bash
   pnpm build
   ```

6. **Run the built version:**
   ```bash
   pnpm start
   ```

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
2. Make your changes.
3. Test your changes (see below).
4. Commit with a clear message following our [naming conventions](#pull-request-naming).

### Running Tests

Bluekeys uses [Vitest](https://vitest.dev/) for unit testing.

```bash
pnpm test
```

Tests are located in the `tests/` directory and cover the game engine, scoring logic, word generation, funbox transformations, and more. If you're adding new functionality to the engine or config layer, please add corresponding tests.

### Creating a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/my-feature
   ```
2. Open a pull request against the `main` branch of `anirban12d/bluekeys`.
3. Add a clear description of what your PR does and why.
4. If your change is visual (new theme, UI change), include a screenshot or terminal recording.

## Standards and Guidelines

### Pull Request Naming

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for PR titles:

| Type | Description |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `impr` | An improvement to an existing feature |
| `docs` | Documentation changes |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

**Examples:**
- `feat: add japanese language pack`
- `fix: correct WPM calculation for quote mode`
- `impr(themes): add catppuccin latte theme`
- `docs: update contributing guide`

### Theme Guidelines

Before submitting a new theme:

- Your theme must be visually distinct from existing themes.
- Text must be readable against the background.
- Ensure the theme works well with both `flipTestColors` and `colorfulMode` on and off.
- Follow the steps in [THEMES.md](./THEMES.md).

### Language Guidelines

- Do not include expletive or offensive words.
- Ensure your JSON is valid (no trailing commas).
- A minimum of 200 words is required for a base language file.
- Name files appropriately: `language.json` for the base list, `language_1k.json` for 1000 words.
- Follow the steps in [LANGUAGES.md](./LANGUAGES.md).

### Funbox Guidelines

- Funbox modes should be fun and not break the core typing experience.
- Each mode must have a unique name, label, and description.
- If the mode transforms words, ensure the transformation is deterministic.
- Follow the steps in [FUNBOX.md](./FUNBOX.md).

## Project Structure

```
src/
├── app/            # Root React component and screen routing
├── cli/            # CLI entry point and argument parsing
├── config/         # Default config, themes, difficulty settings
├── constants/      # Game content data and loaders
│   ├── languages/  # Language word lists (JSON) and loader
│   ├── quotes/     # Quote collections (JSON) and loader
│   └── funbox/     # Funbox mode definitions and transforms
├── engine/         # Pure game logic (no UI dependencies)
├── input/          # Key mapping and navigation keybindings
├── state/          # Redux-like store and persistence (config/results I/O)
├── ui/
│   ├── components/ # Reusable UI components (WordStream, Cursor, etc.)
│   ├── hooks/      # React hooks (useGame, useKeyboard, useTimer, etc.)
│   └── screens/    # Full-screen views (Game, Menu, Settings, etc.)
└── utils/          # Formatting helpers
```

For a full architectural walkthrough, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Questions

If you have questions or run into issues, [open a discussion](https://github.com/anirban12d/bluekeys/discussions) or [file an issue](https://github.com/anirban12d/bluekeys/issues) on GitHub.
