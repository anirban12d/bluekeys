# Adding Funbox Modes

This guide explains how to add a new funbox mode to Bluekeys.

### Table of Contents

- [Overview](#overview)
- [How Funbox Works](#how-funbox-works)
- [Creating a Funbox Mode](#creating-a-funbox-mode)
- [FunboxDefinition Properties](#funboxdefinition-properties)
- [Testing](#testing)
- [Submitting](#submitting)

## Overview

Funbox modes are fun modifiers that change how words appear or how the test behaves. Examples include mirroring words, randomizing capitalization, replacing spaces with underscores, and generating binary strings.

All funbox definitions live in `src/constants/funbox/index.ts`.

## How Funbox Works

Each funbox mode is a `FunboxDefinition` object. The word generator applies the mode's `wordTransform` function (if any) to each word before displaying it. Some modes also replace spaces, disable punctuation/numbers, or generate their own word sets entirely.

## Creating a Funbox Mode

### Step 1: Add the type

Open `src/engine/types.ts` and add your funbox name to the `FunboxName` union type:

```typescript
export type FunboxName =
  | "none"
  | "mirror"
  // ... existing names
  | "my_funbox";
```

### Step 2: Add the definition

Open `src/constants/funbox/index.ts` and add a new entry to the `FUNBOX_LIST` array:

```typescript
{
  name: "my_funbox",
  label: "my funbox",
  description: "Short description of what this mode does",
  wordTransform: (word) => {
    // Transform each word. Return the modified string.
    return word.toUpperCase();
  },
},
```

### Step 3: Add to definitions (if applicable)

If there is a separate funbox definitions file for the UI (used by settings screen), add your mode's metadata there too.

## FunboxDefinition Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `FunboxName` | Yes | Unique identifier matching the type union |
| `label` | `string` | Yes | Display name shown in the UI |
| `description` | `string` | Yes | Short description for the settings screen |
| `wordTransform` | `(word: string) => string` | No | Function applied to each word |
| `spaceReplacement` | `string` | No | Character to replace spaces with (e.g., `"_"`) |
| `disablesPunctuation` | `boolean` | No | If `true`, punctuation is forced off |
| `disablesNumbers` | `boolean` | No | If `true`, numbers are forced off |
| `disablesBackspace` | `boolean` | No | If `true`, backspace is disabled |
| `generatesOwnWords` | `boolean` | No | If `true`, this mode provides its own word list |
| `affectsWordCount` | `boolean` | No | If `true`, the mode changes the effective word count |

## Testing

1. Run the app and select your funbox mode from Settings:
   ```bash
   pnpm dev
   ```

2. Verify:
   - Words are transformed correctly
   - The test can be completed with the transformation active
   - Scoring works correctly (correct characters are counted against the transformed text)
   - The mode name and description display properly in settings

3. Run tests:
   ```bash
   pnpm test
   ```

4. If your transformation is non-trivial, add a unit test in `tests/funbox.test.ts`.

## Submitting

1. Create a branch: `git checkout -b feat/funbox-my-funbox`
2. Commit with a message like: `feat(funbox): add my_funbox mode`
3. Open a pull request describing what the mode does.
