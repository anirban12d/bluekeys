# Adding Languages

This guide explains how to add a new language or word list to Bluekeys.

### Table of Contents

- [Overview](#overview)
- [Creating a Language File](#creating-a-language-file)
- [Registering the Language](#registering-the-language)
- [Testing](#testing)
- [Submitting](#submitting)
- [Language Guidelines](#language-guidelines)

## Overview

Language word lists are JSON files stored in `src/constants/languages/data/`. Each file contains a list of words that Bluekeys randomly selects from during typing tests.

## Creating a Language File

Create a new JSON file in `src/constants/languages/data/` named after the language:

- Base list (200+ words): `language.json` (e.g., `italian.json`)
- Extended list (1000 words): `language_1k.json` (e.g., `italian_1k.json`)
- Code languages: `code_language.json` (e.g., `code_rust.json`)

The file format:

```json
{
  "name": "italian",
  "orderedByFrequency": true,
  "words": [
    "di",
    "che",
    "non",
    "il",
    "la",
    "...200+ more words"
  ]
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Language name (must match filename without `.json`) |
| `orderedByFrequency` | `boolean` | `true` if words are sorted most-common-first |
| `noLazyMode` | `boolean` (optional) | Set `true` if lazy mode doesn't apply to this language |
| `words` | `string[]` | Array of words |

## Registering the Language

No manual registration is needed. The language loader in `src/constants/languages/index.ts` automatically discovers all `.json` files in the `data/` directory. Simply adding your JSON file to `src/constants/languages/data/` is enough.

## Testing

1. Run the app with your new language:
   ```bash
   pnpm dev -- --language italian
   ```

2. Verify that:
   - Words display correctly in the terminal
   - Special characters (accents, diacritics) render properly
   - The typing test accepts correct input for all characters
   - Word count matches the expected amount

3. Run the test suite:
   ```bash
   pnpm test
   ```

## Submitting

1. Create a branch: `git checkout -b feat/lang-italian`
2. Commit with a message like: `feat(languages): add italian word list`
3. Open a pull request.

## Language Guidelines

- **Minimum 200 words** for a base language file.
- **No expletive or offensive words.**
- Words should be common, everyday vocabulary where possible.
- If ordered by frequency, the most common words should come first.
- Ensure valid JSON — no trailing commas, proper encoding (UTF-8).
- File name must match the `name` field inside the JSON.
- For code languages, use keywords, built-in functions, and common patterns from that language.
