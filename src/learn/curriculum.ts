// ── Learning Mode Curriculum ────────────────────────────────────────

export interface Lesson {
  id: string;
  name: string;
  keys: string[];        // keys this lesson focuses on
  allKeys: string[];     // all keys learned up to and including this lesson
  charCount: number;     // how many characters in the lesson
  type: "drill" | "words" | "review";
}

export interface Section {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Level {
  id: string;
  name: string;
  sections: Section[];
}

// Build cumulative key sets
function cumulative(groups: string[][]): string[][] {
  const result: string[][] = [];
  const all: string[] = [];
  for (const g of groups) {
    all.push(...g);
    result.push([...all]);
  }
  return result;
}

const HOME_GROUPS = [
  ["j", "f"],
  ["k", "d"],
  ["l", "s"],
  [";", "a"],
  ["g", "h"],
];

const TOP_GROUPS = [
  ["u", "r"],
  ["i", "e"],
  ["o", "w"],
  ["p", "q"],
  ["y", "t"],
];

const BOTTOM_GROUPS = [
  ["m", "v"],
  ["n", "b"],
  [",", "c"],
  [".", "x"],
  ["/", "z"],
];

const HOME_CUM = cumulative(HOME_GROUPS);
const TOP_CUM_BASE = HOME_CUM[HOME_CUM.length - 1]!;
const TOP_CUM = cumulative(TOP_GROUPS).map((k) => [...TOP_CUM_BASE, ...k]);
const BOTTOM_CUM_BASE = TOP_CUM[TOP_CUM.length - 1]!;
const BOTTOM_CUM = cumulative(BOTTOM_GROUPS).map((k) => [...BOTTOM_CUM_BASE, ...k]);
const ALL_LETTERS = BOTTOM_CUM[BOTTOM_CUM.length - 1]!;

export const CURRICULUM: Level[] = [
  {
    id: "beginner",
    name: "Beginner",
    sections: [
      {
        id: "home-row",
        name: "Home Row",
        lessons: [
          {
            id: "home-1",
            name: "J and F Keys",
            keys: ["j", "f"],
            allKeys: HOME_CUM[0]!,
            charCount: 40,
            type: "drill",
          },
          {
            id: "home-2",
            name: "J, F, and Space",
            keys: ["j", "f", " "],
            allKeys: [...HOME_CUM[0]!, " "],
            charCount: 50,
            type: "drill",
          },
          {
            id: "home-3",
            name: "D and K Keys",
            keys: ["d", "k"],
            allKeys: HOME_CUM[1]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "home-4",
            name: "S and L Keys",
            keys: ["s", "l"],
            allKeys: HOME_CUM[2]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "home-5",
            name: "A and ; Keys",
            keys: ["a", ";"],
            allKeys: HOME_CUM[3]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "home-6",
            name: "G and H Keys",
            keys: ["g", "h"],
            allKeys: HOME_CUM[4]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "home-review",
            name: "Home Row Review",
            keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
            allKeys: HOME_CUM[4]!,
            charCount: 80,
            type: "review",
          },
        ],
      },
      {
        id: "top-row",
        name: "Top Row",
        lessons: [
          {
            id: "top-1",
            name: "U and R Keys",
            keys: ["u", "r"],
            allKeys: TOP_CUM[0]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "top-2",
            name: "I and E Keys",
            keys: ["i", "e"],
            allKeys: TOP_CUM[1]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "top-3",
            name: "O and W Keys",
            keys: ["o", "w"],
            allKeys: TOP_CUM[2]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "top-4",
            name: "P and Q Keys",
            keys: ["p", "q"],
            allKeys: TOP_CUM[3]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "top-5",
            name: "Y and T Keys",
            keys: ["y", "t"],
            allKeys: TOP_CUM[4]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "top-review",
            name: "Top Row Review",
            keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
            allKeys: TOP_CUM[4]!,
            charCount: 80,
            type: "review",
          },
        ],
      },
      {
        id: "bottom-row",
        name: "Bottom Row",
        lessons: [
          {
            id: "bot-1",
            name: "M and V Keys",
            keys: ["m", "v"],
            allKeys: BOTTOM_CUM[0]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "bot-2",
            name: "N and B Keys",
            keys: ["n", "b"],
            allKeys: BOTTOM_CUM[1]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "bot-3",
            name: "Comma and C Keys",
            keys: [",", "c"],
            allKeys: BOTTOM_CUM[2]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "bot-4",
            name: "Period and X Keys",
            keys: [".", "x"],
            allKeys: BOTTOM_CUM[3]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "bot-5",
            name: "Slash and Z Keys",
            keys: ["/", "z"],
            allKeys: BOTTOM_CUM[4]!,
            charCount: 50,
            type: "drill",
          },
          {
            id: "bot-review",
            name: "Bottom Row Review",
            keys: ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
            allKeys: BOTTOM_CUM[4]!,
            charCount: 80,
            type: "review",
          },
        ],
      },
    ],
  },
  {
    id: "intermediate",
    name: "Intermediate",
    sections: [
      {
        id: "words",
        name: "Word Practice",
        lessons: [
          {
            id: "words-home",
            name: "Home Row Words",
            keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
            allKeys: HOME_CUM[4]!,
            charCount: 80,
            type: "words",
          },
          {
            id: "words-common",
            name: "Common Words",
            keys: ALL_LETTERS,
            allKeys: ALL_LETTERS,
            charCount: 100,
            type: "words",
          },
          {
            id: "words-longer",
            name: "Longer Words",
            keys: ALL_LETTERS,
            allKeys: ALL_LETTERS,
            charCount: 120,
            type: "words",
          },
        ],
      },
      {
        id: "accuracy",
        name: "Accuracy Drills",
        lessons: [
          {
            id: "acc-similar",
            name: "Similar Keys",
            keys: ["e", "r", "i", "u", "o", "p"],
            allKeys: ALL_LETTERS,
            charCount: 80,
            type: "drill",
          },
          {
            id: "acc-mirror",
            name: "Mirror Pairs",
            keys: ["d", "k", "s", "l", "f", "j", "a", ";"],
            allKeys: ALL_LETTERS,
            charCount: 80,
            type: "drill",
          },
          {
            id: "acc-review",
            name: "Full Review",
            keys: ALL_LETTERS,
            allKeys: ALL_LETTERS,
            charCount: 120,
            type: "review",
          },
        ],
      },
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    sections: [
      {
        id: "speed",
        name: "Speed Building",
        lessons: [
          {
            id: "speed-short",
            name: "Short Words Sprint",
            keys: ALL_LETTERS,
            allKeys: ALL_LETTERS,
            charCount: 100,
            type: "words",
          },
          {
            id: "speed-mixed",
            name: "Mixed Length",
            keys: ALL_LETTERS,
            allKeys: ALL_LETTERS,
            charCount: 120,
            type: "words",
          },
          {
            id: "speed-long",
            name: "Long Words Challenge",
            keys: ALL_LETTERS,
            allKeys: ALL_LETTERS,
            charCount: 150,
            type: "words",
          },
        ],
      },
    ],
  },
];

// Flatten all lessons in order for sequential access
export function getAllLessons(): Lesson[] {
  const lessons: Lesson[] = [];
  for (const level of CURRICULUM) {
    for (const section of level.sections) {
      lessons.push(...section.lessons);
    }
  }
  return lessons;
}

export function findLesson(id: string): Lesson | null {
  for (const level of CURRICULUM) {
    for (const section of level.sections) {
      for (const lesson of section.lessons) {
        if (lesson.id === id) return lesson;
      }
    }
  }
  return null;
}
