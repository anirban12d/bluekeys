# Bluekeys

**Monkeytype for your terminal.**



https://github.com/user-attachments/assets/8d9b45df-4393-4d3a-a882-71819f1a64b4



---

## About

Bluekeys is a feature-rich typing speed test that runs entirely in your terminal. Born from a love of [Monkeytype](https://monkeytype.com) and a desire to never leave the command line, Bluekeys brings the same addictive typing test experience to your terminal with full keyboard-driven navigation, beautiful themes, and detailed stats.

No browser. No distractions. Just you and your words per minute.

## Installation

### Homebrew (macOS / Linux)

```bash
brew install anirban12d/bluekeys/bluekeys
```

### Quick install (macOS / Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/anirban12d/bluekeys/main/scripts/install.sh | sh
```

This downloads a prebuilt binary — no Node.js required.

### npm

```bash
npm install -g bluekeys
```

### From a specific release

```bash
# Install a specific version
curl -fsSL https://raw.githubusercontent.com/anirban12d/bluekeys/main/scripts/install.sh | sh -s v1.1.0
```

Then simply run:

```bash
bluekeys
```

### Upgrading

```bash
brew upgrade bluekeys               # if installed via Homebrew
bluekeys upgrade                    # upgrade to latest version
bluekeys upgrade v1.1.0             # install a specific version
```

Or re-run the install script:

```bash
curl -fsSL https://raw.githubusercontent.com/anirban12d/bluekeys/main/scripts/install.sh | sh
```

### Uninstalling

```bash
brew uninstall bluekeys             # if installed via Homebrew
npm uninstall -g bluekeys           # if installed via npm
sudo rm /usr/local/bin/bluekeys     # if installed via curl
```

To also remove your config and data:

```bash
rm -rf ~/.bluekeys
```

### Quick start with flags

```bash
bluekeys --mode time -t 60                    # 60-second timed test
bluekeys --mode words -w 100                  # 100-word test
bluekeys --mode quote                         # quote mode
bluekeys --mode code --code-language python   # type Python code snippets
bluekeys --mode cli --cli-category git        # type git commands
bluekeys --theme dracula                      # start with a specific theme
bluekeys --language french                    # test in French
bluekeys --punctuation --numbers              # enable punctuation and numbers
```

## Features

### Test modes

- **Time** — 15, 30, 60, or 120 second tests
- **Words** — 10, 25, 50, 100, or 200 word tests
- **Quote** — type real quotes (short, medium, long, thicc)
- **Code** — type real code snippets (Python, JavaScript, Go, Rust)
- **CLI** — type real terminal commands (general, git, docker, npm, linux)
- **Zen** — free typing, no target text
- **Custom** — paste your own text

### Languages

English, French, German, Spanish, Python, JavaScript — with more on the way.

### 15 themes

Serika Dark, Dracula, Monokai, Nord, Gruvbox, Solarized Dark, Catppuccin Mocha, Tokyo Night, Rose Pine, Carbon, Minimal, Olive, 80s After Dark, Botanical, and Serika Light. Live preview when browsing themes in settings.

### Keybinding modes

Navigate menus and settings with the style you prefer:

- **Normal** — arrow keys
- **Vim** — `hjkl` navigation, `q` to go back
- **Emacs** — `Ctrl+N/P/F/B` navigation, `Ctrl+G` to go back

Keybinding mode only affects navigation. It never interferes with your typing test.

### Learning mode

A full touch-typing curriculum built right into the terminal:

- **25 progressive lessons** across Beginner, Intermediate, and Advanced levels
- **Keyboard visualization** with color-coded finger assignments — shows exactly which finger to use for each key
- **Home row first** — start with J and F, build up row by row
- **Three lesson types** — key drills, real-word practice, and mixed reviews
- **Star ratings** — earn up to 3 stars per lesson based on accuracy (80% / 92% / 98%)
- **Persistent progress** — pick up where you left off across sessions

Access from the main menu via **learn**.

### Error heatmap

- **Per-test heatmap** on the results screen showing your most mistyped words with character-level error coloring
- **Cross-session heatmap screen** with 5 tabs:
  - **Overview** — total tests, words typed, errors, accuracy, avg/best WPM
  - **Most missed words** — all-time error words ranked with bar charts
  - **Character mistakes** — which character pairs you confuse most (e.g. h→e)
  - **Accuracy trend** — sparkline showing improvement over time
  - **Practice suggestions** — words to focus on based on your history

Access from the main menu via **heatmap**.

### Detailed stats

- WPM, raw WPM, accuracy, consistency
- Per-second WPM/raw history chart
- Character breakdown (correct / incorrect / extra / missed)
- Personal best tracking per mode and configuration
- Results history saved locally

### Difficulty modes

- **Normal** — standard typing test
- **Expert** — fail if accuracy drops below 95%
- **Master** — fail on any error

### Funbox modes

22 fun modifiers: mirror, upside down, rAnDoMcAsE, capitals, nospace, backwards, ddoouubblleedd, memory, read ahead, gibberish, specials, binary, hexadecimal, rot13, and more.

### Other features

- Confidence mode (no backspace / word-level backspace only)
- Stop on error (word or letter level)
- Freedom mode, lazy mode, blind mode, strict space
- Configurable caret style (block, outline, underline)
- Live WPM, accuracy, and burst display
- Tape mode (letter or word)
- Multiple highlight modes
- Quick restart with Tab, Esc, or Enter
- Repeat test with Enter on results screen
- Personal best notifications

## Configuration

Bluekeys stores its config at `~/.bluekeys/config.toml` (Windows: `%APPDATA%\.bluekeys\config.toml`). A fully commented config file is generated on first run.

```toml
# mode: time | words | quote | code | cli | zen | custom
mode = "time"
timeLimit = 30
language = "english"

# Code snippets language (used when mode = "code")
# Available: python, javascript, go, rust
codeLanguage = "python"

# CLI commands category (used when mode = "cli")
# Available: general, git, docker, npm, linux
cliCategory = "general"

# keybindingMode: normal | vim | emacs
keybindingMode = "vim"

theme = "dracula"
```

All settings can also be changed from the in-app settings screen.

### Data files

| File                  | Location       | Purpose                  |
| --------------------- | -------------- | ------------------------ |
| `config.toml`         | `~/.bluekeys/` | All settings             |
| `pb.json`             | `~/.bluekeys/` | Personal bests           |
| `results.ndjson`      | `~/.bluekeys/` | Full result history      |
| `learn-progress.json` | `~/.bluekeys/` | Learning mode progress   |

## CLI options

| Flag               | Short | Description                                          |
| ------------------ | ----- | ---------------------------------------------------- |
| `--mode`           | `-m`  | Test mode (time, words, quote, code, cli, zen, custom) |
| `--time`           | `-t`  | Time limit in seconds                                |
| `--words`          | `-w`  | Word count                                           |
| `--language`       | `-l`  | Language                                             |
| `--difficulty`     |       | normal, expert, master                               |
| `--theme`          |       | Theme name                                           |
| `--quote-length`   |       | 0-3 (short to thicc)                                 |
| `--code-language`  |       | Code language (python, javascript, go, rust)         |
| `--cli-category`   |       | CLI category (general, git, docker, npm, linux)      |
| `--punctuation`    |       | Enable punctuation                                   |
| `--no-punctuation` |       | Disable punctuation                                  |
| `--numbers`        |       | Enable numbers                                       |
| `--no-numbers`     |       | Disable numbers                                      |
| `--version`        | `-v`  | Show version                                         |
| `--help`           | `-h`  | Show help                                            |

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `bluekeys`           | Open interactive menu                 |
| `bluekeys upgrade`   | Upgrade to latest version             |
| `bluekeys version`   | Show version                          |
| `bluekeys help`      | Show help                             |

## Building from source

```bash
git clone https://github.com/anirban12d/bluekeys.git
cd bluekeys
pnpm install
pnpm run build
node dist/cli/index.js
```

### Building a standalone binary

Requires [Bun](https://bun.sh):

```bash
pnpm build:binary
./bluekeys
```

## Documentation

| Document                             | Description                                                     |
| ------------------------------------ | --------------------------------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md) | Codebase structure, engine/UI separation, directory map         |
| [Contributing](docs/CONTRIBUTING.md) | How to set up the dev environment, make changes, and submit PRs |
| [Themes](docs/THEMES.md)             | How to create and submit a new theme                            |
| [Languages](docs/LANGUAGES.md)       | How to add a new language or word list                          |
| [Quotes](docs/QUOTES.md)             | How to add new quotes for quote mode                            |
| [Funbox](docs/FUNBOX.md)             | How to create a new funbox mode                                 |

## Contributing

Contributions are welcome! See the [Contributing Guide](docs/CONTRIBUTING.md) for full details on setting up your development environment, running tests, and submitting pull requests.

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

For specific contribution types, see:

- Adding a theme? Follow [docs/THEMES.md](docs/THEMES.md)
- Adding a language? Follow [docs/LANGUAGES.md](docs/LANGUAGES.md)
- Adding quotes? Follow [docs/QUOTES.md](docs/QUOTES.md)
- Adding a funbox mode? Follow [docs/FUNBOX.md](docs/FUNBOX.md)

## Bug reports & feature requests

Found a bug or have an idea? [Open an issue](https://github.com/anirban12d/bluekeys/issues) on GitHub.

## Support the project

If you enjoy Bluekeys, consider supporting its development:

<a href="https://www.patreon.com/anirban12d">
  <img src="https://img.shields.io/badge/Patreon-Support-F96854?style=for-the-badge&logo=patreon&logoColor=white" alt="Support on Patreon" />
</a>

<a href="https://www.buymeacoffee.com/anirban12d">
  <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee" />
</a>

## Credits

Bluekeys wouldn't exist without these projects:

- **[Monkeytype](https://github.com/monkeytypegame/monkeytype)** — The original typing test that inspired this project. Bluekeys brings the Monkeytype experience to the terminal. All credit for the core concept, game modes, scoring logic, and design philosophy goes to the Monkeytype team.

- **[Ink](https://github.com/vadimdemedes/ink)** — The React-based terminal UI framework that powers Bluekeys' interface. Ink makes it possible to build rich, interactive terminal apps with React components.

## License

[GPL-3.0](LICENSE) — made by [anirban12d](https://github.com/anirban12d)
