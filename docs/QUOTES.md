# Adding Quotes

This guide explains how to add new quotes to Bluekeys.

### Table of Contents

- [Overview](#overview)
- [Quote File Format](#quote-file-format)
- [Adding Quotes to an Existing Language](#adding-quotes-to-an-existing-language)
- [Creating a New Quote Language File](#creating-a-new-quote-language-file)
- [Testing](#testing)
- [Submitting](#submitting)
- [Quote Guidelines](#quote-guidelines)

## Overview

Quotes are JSON files stored in `src/constants/quotes/data/`. Each file contains a collection of quotes for a specific language, grouped by length. Quote mode randomly selects a quote for the user to type.

## Quote File Format

Each quote file follows this structure:

```json
{
  "language": "english",
  "groups": [
    [0, 100],
    [101, 300],
    [301, 600],
    [601, 9999]
  ],
  "quotes": [
    {
      "text": "The quote text goes here.",
      "source": "Book, movie, or author name",
      "id": 1,
      "length": 25
    }
  ]
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `language` | `string` | Language name (must match filename without `.json`) |
| `groups` | `[number, number][]` | Length ranges defining quote categories: short, medium, long, thicc |
| `quotes` | `object[]` | Array of quote objects |

### Quote Object

| Field | Type | Description |
|---|---|---|
| `text` | `string` | The full quote text |
| `source` | `string` | Attribution — book title, movie, author, song, etc. |
| `id` | `number` | Unique integer ID within the file |
| `length` | `number` | Character count of the `text` field |

### Length Groups

The `groups` array defines the four quote length categories used in the UI:

| Index | Label | Default range (English) |
|---|---|---|
| 0 | short | 0–100 characters |
| 1 | medium | 101–300 characters |
| 2 | long | 301–600 characters |
| 3 | thicc | 601+ characters |

## Adding Quotes to an Existing Language

1. Open the quote file at `src/constants/quotes/data/<language>.json`.
2. Add your quote object to the **end** of the `quotes` array.
3. Set the `id` to the next available integer (one higher than the last quote's ID).
4. Set `length` to the exact character count of your `text` string.

```json
{
  "text": "Your new quote text here.",
  "source": "Source Name",
  "id": 42,
  "length": 25
}
```

## Creating a New Quote Language File

1. Create a new file at `src/constants/quotes/data/<language>.json` (e.g., `french.json`).
2. Use the file format shown above.
3. Set appropriate `groups` ranges for the language.
4. Add at least 10 quotes to start.
5. Register the quote file in the quote loader at `src/constants/quotes/index.ts` if required.

## Testing

1. Run the app in quote mode with your language:
   ```bash
   pnpm dev -- --mode quote --language english
   ```

2. Verify that:
   - Quotes display correctly
   - The `length` field matches the actual character count
   - Special characters and punctuation render properly
   - All four length categories (short/medium/long/thicc) work if you have quotes in each range

3. Run the test suite:
   ```bash
   pnpm test
   ```

## Submitting

1. Create a branch: `git checkout -b feat/quotes-add-new`
2. Commit with a message like: `feat(quotes): add new english quotes`
3. Open a pull request.

## Quote Guidelines

- **Accuracy** — quotes must be exact. Do not paraphrase or modify the original text.
- **Attribution** — always include the correct source (book, movie, song, author, etc.).
- **No offensive content** — quotes must not contain slurs, explicit content, or content that promotes harm.
- **No duplicate quotes** — check existing quotes before adding. Duplicate `id` values will cause issues.
- **Length field must be accurate** — count the characters in your `text` and set `length` accordingly.
- **Proper punctuation and capitalization** — quotes should use correct grammar as they appear in the original source.
- **Minimum length** — quotes should be at least 20 characters long.
- **UTF-8 encoding** — ensure your file uses UTF-8 encoding, especially for non-English quotes with accents or special characters.
