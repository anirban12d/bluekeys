# Bluekeys

**Monkeytype for your terminal.**

---

## About

Bluekeys is a feature-rich typing speed test that runs entirely in your terminal. Born from a love of [Monkeytype](https://monkeytype.com) and a desire to never leave the command line, Bluekeys brings the same addictive typing test experience to your terminal with full keyboard-driven navigation, beautiful themes, and detailed stats.

No browser. No distractions. Just you and your words per minute.

## Installation

```bash
npm install -g bluekeys
```

Then simply run:

```bash
bluekeys
```

### Quick start with flags

```bash
bluekeys --mode time -t 60          # 60-second timed test
bluekeys --mode words -w 100        # 100-word test
bluekeys --mode quote               # quote mode
bluekeys --theme dracula            # start with a specific theme
bluekeys --language french           # test in French
bluekeys --punctuation --numbers     # enable punctuation and numbers
```

## Features

### Test modes

- **Time** — 15, 30, 60, or 120 second tests
- **Words** — 10, 25, 50, 100, or 200 word tests
- **Quote** — type real quotes (short, medium, long, thicc)
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
# mode: time | words | quote | zen | custom
mode = "time"
timeLimit = 30
language = "english"

# keybindingMode: normal | vim | emacs
keybindingMode = "vim"

theme = "dracula"
```

All settings can also be changed from the in-app settings screen.

### Data files

| File             | Location       | Purpose             |
| ---------------- | -------------- | ------------------- |
| `config.toml`    | `~/.bluekeys/` | All settings        |
| `pb.json`        | `~/.bluekeys/` | Personal bests      |
| `results.ndjson` | `~/.bluekeys/` | Full result history |

## CLI options

| Flag               | Short | Description                                 |
| ------------------ | ----- | ------------------------------------------- |
| `--mode`           | `-m`  | Test mode (time, words, quote, zen, custom) |
| `--time`           | `-t`  | Time limit in seconds                       |
| `--words`          | `-w`  | Word count                                  |
| `--language`       | `-l`  | Language                                    |
| `--difficulty`     |       | normal, expert, master                      |
| `--theme`          |       | Theme name                                  |
| `--quote-length`   |       | 0-3 (short to thicc)                        |
| `--punctuation`    |       | Enable punctuation                          |
| `--no-punctuation` |       | Disable punctuation                         |
| `--numbers`        |       | Enable numbers                              |
| `--no-numbers`     |       | Disable numbers                             |

Running `bluekeys` with no flags opens the interactive menu.

## Building from source

```bash
git clone https://github.com/anirban12d/bluekeys.git
cd bluekeys
pnpm install
pnpm run build
node dist/cli/index.js
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
