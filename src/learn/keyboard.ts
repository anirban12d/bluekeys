// ── Finger assignments for QWERTY layout ────────────────────────────

export type Finger =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky"
  | "thumb";

export type Hand = "left" | "right";

export function getHand(finger: Finger): Hand {
  if (finger === "thumb") return "right"; // space is conventionally right thumb
  return finger.startsWith("left") ? "left" : "right";
}

export const FINGER_LABELS: Record<Finger, string> = {
  "left-pinky": "left pinky",
  "left-ring": "left ring",
  "left-middle": "left middle",
  "left-index": "left index",
  "right-index": "right index",
  "right-middle": "right middle",
  "right-ring": "right ring",
  "right-pinky": "right pinky",
  "thumb": "thumb",
};

// Map every typeable key to its standard touch-typing finger
export const KEY_FINGER_MAP: Record<string, Finger> = {
  // Number row
  "`": "left-pinky", "~": "left-pinky",
  "1": "left-pinky", "!": "left-pinky",
  "2": "left-ring",  "@": "left-ring",
  "3": "left-middle", "#": "left-middle",
  "4": "left-index", "$": "left-index",
  "5": "left-index", "%": "left-index",
  "6": "right-index", "^": "right-index",
  "7": "right-index", "&": "right-index",
  "8": "right-middle", "*": "right-middle",
  "9": "right-ring",  "(": "right-ring",
  "0": "right-pinky", ")": "right-pinky",
  "-": "right-pinky", "_": "right-pinky",
  "=": "right-pinky", "+": "right-pinky",

  // Top row
  "q": "left-pinky",  "Q": "left-pinky",
  "w": "left-ring",   "W": "left-ring",
  "e": "left-middle",  "E": "left-middle",
  "r": "left-index",  "R": "left-index",
  "t": "left-index",  "T": "left-index",
  "y": "right-index", "Y": "right-index",
  "u": "right-index", "U": "right-index",
  "i": "right-middle", "I": "right-middle",
  "o": "right-ring",  "O": "right-ring",
  "p": "right-pinky", "P": "right-pinky",
  "[": "right-pinky", "{": "right-pinky",
  "]": "right-pinky", "}": "right-pinky",
  "\\": "right-pinky", "|": "right-pinky",

  // Home row
  "a": "left-pinky",  "A": "left-pinky",
  "s": "left-ring",   "S": "left-ring",
  "d": "left-middle",  "D": "left-middle",
  "f": "left-index",  "F": "left-index",
  "g": "left-index",  "G": "left-index",
  "h": "right-index", "H": "right-index",
  "j": "right-index", "J": "right-index",
  "k": "right-middle", "K": "right-middle",
  "l": "right-ring",  "L": "right-ring",
  ";": "right-pinky", ":": "right-pinky",
  "'": "right-pinky", '"': "right-pinky",

  // Bottom row
  "z": "left-pinky",  "Z": "left-pinky",
  "x": "left-ring",   "X": "left-ring",
  "c": "left-middle",  "C": "left-middle",
  "v": "left-index",  "V": "left-index",
  "b": "left-index",  "B": "left-index",
  "n": "right-index", "N": "right-index",
  "m": "right-index", "M": "right-index",
  ",": "right-middle", "<": "right-middle",
  ".": "right-ring",  ">": "right-ring",
  "/": "right-pinky", "?": "right-pinky",

  // Space
  " ": "thumb",
};

export function getFingerForKey(key: string): Finger {
  return KEY_FINGER_MAP[key] ?? "right-index";
}

// Keyboard rows for rendering (lowercase letters only)
export const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
] as const;

// Home row keys (where fingers rest)
export const HOME_KEYS = new Set(["a", "s", "d", "f", "j", "k", "l", ";"]);

// Finger color indices for consistent color-coding (0-7 maps to 8 fingers)
export const FINGER_COLOR_INDEX: Record<Finger, number> = {
  "left-pinky": 0,
  "left-ring": 1,
  "left-middle": 2,
  "left-index": 3,
  "right-index": 4,
  "right-middle": 5,
  "right-ring": 6,
  "right-pinky": 7,
  "thumb": 4, // same as right-index visually
};
