import type { Lesson } from "./curriculum.js";
import wordList from "../constants/languages/words.json" with { type: "json" };

/**
 * Generate practice text for a lesson.
 * Returns a string of characters/words to type.
 */
export function generateLessonText(lesson: Lesson): string {
  switch (lesson.type) {
    case "drill":
      return generateDrill(lesson);
    case "words":
      return generateWords(lesson);
    case "review":
      return generateReview(lesson);
  }
}

/**
 * Drill: repeat the focused keys in random patterns.
 * Groups of 3-5 chars separated by spaces.
 */
function generateDrill(lesson: Lesson): string {
  const keys = lesson.keys.filter((k) => k !== " ");
  if (keys.length === 0) return "f j f j f j";

  const groups: string[] = [];
  let remaining = lesson.charCount;

  while (remaining > 0) {
    const groupLen = 2 + Math.floor(Math.random() * 4); // 2-5 chars
    let group = "";
    for (let i = 0; i < groupLen && remaining > 0; i++) {
      group += keys[Math.floor(Math.random() * keys.length)]!;
      remaining--;
    }
    groups.push(group);
  }

  return groups.join(" ");
}

/**
 * Words: filter the English word list to words using only learned keys.
 */
function generateWords(lesson: Lesson): string {
  const allowedSet = new Set(lesson.allKeys);
  // Always allow space for word separation
  const words = (wordList as string[]).filter(
    (w) => w.length >= 2 && w.length <= 8 && [...w].every((ch) => allowedSet.has(ch)),
  );

  if (words.length === 0) {
    // Fallback to drill if no words match
    return generateDrill(lesson);
  }

  const selected: string[] = [];
  let charCount = 0;

  while (charCount < lesson.charCount) {
    const word = words[Math.floor(Math.random() * words.length)]!;
    selected.push(word);
    charCount += word.length + 1; // +1 for space
  }

  return selected.join(" ");
}

/**
 * Review: mix of short words and key groups using all learned keys.
 */
function generateReview(lesson: Lesson): string {
  const allowedSet = new Set(lesson.allKeys);
  const words = (wordList as string[]).filter(
    (w) => w.length >= 2 && w.length <= 6 && [...w].every((ch) => allowedSet.has(ch)),
  );

  const parts: string[] = [];
  let charCount = 0;

  while (charCount < lesson.charCount) {
    if (words.length > 0 && Math.random() < 0.7) {
      // Pick a real word
      const word = words[Math.floor(Math.random() * words.length)]!;
      parts.push(word);
      charCount += word.length + 1;
    } else {
      // Generate a drill group
      const keys = lesson.keys.filter((k) => k !== " ");
      const groupLen = 2 + Math.floor(Math.random() * 3);
      let group = "";
      for (let i = 0; i < groupLen; i++) {
        group += keys[Math.floor(Math.random() * keys.length)]!;
      }
      parts.push(group);
      charCount += group.length + 1;
    }
  }

  return parts.join(" ");
}
