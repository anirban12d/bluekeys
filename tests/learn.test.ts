import { describe, it, expect } from "vitest";
import { getFingerForKey, KEY_FINGER_MAP, KEYBOARD_ROWS, HOME_KEYS } from "../src/learn/keyboard.js";
import { CURRICULUM, getAllLessons, findLesson } from "../src/learn/curriculum.js";
import { generateLessonText } from "../src/learn/lessonGenerator.js";
import { calculateStars } from "../src/learn/progress.js";

describe("keyboard", () => {
  it("maps home row keys to correct fingers", () => {
    expect(getFingerForKey("f")).toBe("left-index");
    expect(getFingerForKey("j")).toBe("right-index");
    expect(getFingerForKey("d")).toBe("left-middle");
    expect(getFingerForKey("k")).toBe("right-middle");
    expect(getFingerForKey("s")).toBe("left-ring");
    expect(getFingerForKey("l")).toBe("right-ring");
    expect(getFingerForKey("a")).toBe("left-pinky");
    expect(getFingerForKey(";")).toBe("right-pinky");
  });

  it("maps space to thumb", () => {
    expect(getFingerForKey(" ")).toBe("thumb");
  });

  it("has all letter keys mapped", () => {
    for (const ch of "abcdefghijklmnopqrstuvwxyz") {
      expect(KEY_FINGER_MAP[ch]).toBeDefined();
    }
  });

  it("keyboard rows contain all letters", () => {
    const allKeys = KEYBOARD_ROWS.flat();
    expect(allKeys).toHaveLength(30); // 10 per row
  });

  it("home keys set contains 8 keys", () => {
    expect(HOME_KEYS.size).toBe(8);
  });
});

describe("curriculum", () => {
  it("has 3 levels", () => {
    expect(CURRICULUM).toHaveLength(3);
    expect(CURRICULUM[0]!.id).toBe("beginner");
    expect(CURRICULUM[1]!.id).toBe("intermediate");
    expect(CURRICULUM[2]!.id).toBe("advanced");
  });

  it("getAllLessons returns all lessons in order", () => {
    const lessons = getAllLessons();
    expect(lessons.length).toBeGreaterThan(15);
    expect(lessons[0]!.id).toBe("home-1");
  });

  it("findLesson returns the correct lesson", () => {
    const lesson = findLesson("home-3");
    expect(lesson).not.toBeNull();
    expect(lesson!.name).toBe("D and K Keys");
    expect(lesson!.keys).toContain("d");
    expect(lesson!.keys).toContain("k");
  });

  it("findLesson returns null for unknown id", () => {
    expect(findLesson("nonexistent")).toBeNull();
  });

  it("each lesson has non-empty allKeys", () => {
    const lessons = getAllLessons();
    for (const lesson of lessons) {
      expect(lesson.allKeys.length).toBeGreaterThan(0);
      // allKeys should always include the lesson's focus keys (except space)
      for (const key of lesson.keys) {
        if (key !== " ") {
          expect(lesson.allKeys).toContain(key);
        }
      }
    }
  });

  it("all lesson ids are unique", () => {
    const lessons = getAllLessons();
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("lessonGenerator", () => {
  it("generates drill text using only lesson keys", () => {
    const lesson = findLesson("home-1")!;
    const text = generateLessonText(lesson);
    expect(text.length).toBeGreaterThan(0);
    // Should only contain j, f, and spaces
    for (const ch of text) {
      expect(["j", "f", " "].includes(ch)).toBe(true);
    }
  });

  it("generates review text", () => {
    const lesson = findLesson("home-review")!;
    const text = generateLessonText(lesson);
    expect(text.length).toBeGreaterThan(0);
  });

  it("generates word-based text", () => {
    const lesson = findLesson("words-common")!;
    const text = generateLessonText(lesson);
    expect(text.length).toBeGreaterThan(0);
    // Should contain spaces (words)
    expect(text).toContain(" ");
  });

  it("generates text of approximately the right length", () => {
    const lesson = findLesson("home-1")!;
    const text = generateLessonText(lesson);
    // Should be at least charCount length (spaces add extra)
    expect(text.length).toBeGreaterThanOrEqual(lesson.charCount);
  });
});

describe("calculateStars", () => {
  it("returns 0 for low accuracy", () => {
    expect(calculateStars(50)).toBe(0);
    expect(calculateStars(79)).toBe(0);
  });

  it("returns 1 for 80%+ accuracy", () => {
    expect(calculateStars(80)).toBe(1);
    expect(calculateStars(91)).toBe(1);
  });

  it("returns 2 for 92%+ accuracy", () => {
    expect(calculateStars(92)).toBe(2);
    expect(calculateStars(97)).toBe(2);
  });

  it("returns 3 for 98%+ accuracy", () => {
    expect(calculateStars(98)).toBe(3);
    expect(calculateStars(100)).toBe(3);
  });
});
