import type { Quote, QuoteCollection, QuoteLength } from "../../engine/types.js";
import englishQuotesRaw from "./data/english.json" with { type: "json" };

// ── Fallback quotes (tech, humor, famous) ───────────────────────────

const FALLBACK_QUOTES: Quote[] = [
  // Tech
  { id: 90001, text: "Any sufficiently advanced technology is indistinguishable from magic.", source: "Arthur C. Clarke", length: 69, group: 0 },
  { id: 90002, text: "The best way to predict the future is to invent it.", source: "Alan Kay", length: 52, group: 0 },
  { id: 90003, text: "Talk is cheap. Show me the code.", source: "Linus Torvalds", length: 32, group: 0 },
  { id: 90004, text: "First, solve the problem. Then, write the code.", source: "John Johnson", length: 48, group: 0 },
  { id: 90005, text: "Programs must be written for people to read, and only incidentally for machines to execute.", source: "Harold Abelson", length: 91, group: 0 },
  { id: 90006, text: "Simplicity is prerequisite for reliability.", source: "Edsger Dijkstra", length: 43, group: 0 },
  { id: 90007, text: "The most disastrous thing that you can ever learn is your first programming language.", source: "Alan Kay", length: 84, group: 0 },
  { id: 90008, text: "The computer was born to solve problems that did not exist before.", source: "Bill Gates", length: 65, group: 0 },
  { id: 90009, text: "Software is a great combination between artistry and engineering.", source: "Bill Gates", length: 64, group: 0 },
  { id: 90010, text: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", source: "Bill Gates", length: 102, group: 1 },
  { id: 90011, text: "The function of good software is to make the complex appear to be simple.", source: "Grady Booch", length: 73, group: 0 },
  { id: 90012, text: "Before software can be reusable it first has to be usable.", source: "Ralph Johnson", length: 59, group: 0 },
  { id: 90013, text: "It's not a bug; it's an undocumented feature.", source: "Anonymous", length: 46, group: 0 },
  { id: 90014, text: "The only way to learn a new programming language is by writing programs in it.", source: "Dennis Ritchie", length: 77, group: 0 },
  { id: 90015, text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", source: "Antoine de Saint-Exupery", length: 106, group: 1 },
  { id: 90016, text: "Java is to JavaScript what car is to carpet.", source: "Chris Heilmann", length: 45, group: 0 },
  { id: 90017, text: "Code is like humor. When you have to explain it, it's bad.", source: "Cory House", length: 58, group: 0 },
  { id: 90018, text: "Fix the cause, not the symptom.", source: "Steve Maguire", length: 31, group: 0 },
  { id: 90019, text: "Optimism is an occupational hazard of programming: feedback is the treatment.", source: "Kent Beck", length: 77, group: 0 },
  { id: 90020, text: "A language that doesn't affect the way you think about programming is not worth knowing.", source: "Alan Perlis", length: 88, group: 0 },
  { id: 90021, text: "The best error message is the one that never shows up.", source: "Thomas Fuchs", length: 55, group: 0 },
  { id: 90022, text: "One of my most productive days was throwing away 1,000 lines of code.", source: "Ken Thompson", length: 69, group: 0 },
  { id: 90023, text: "If debugging is the process of removing software bugs, then programming must be the process of putting them in.", source: "Edsger Dijkstra", length: 112, group: 1 },
  { id: 90024, text: "Walking on water and developing software from a specification are easy if both are frozen.", source: "Edward V. Berard", length: 90, group: 0 },
  { id: 90025, text: "The most important property of a program is whether it accomplishes the intention of its user.", source: "C.A.R. Hoare", length: 93, group: 0 },

  // Humorous
  { id: 90101, text: "There are only two hard things in computer science: cache invalidation, naming things, and off-by-one errors.", source: "Phil Karlton (modified)", length: 110, group: 1 },
  { id: 90102, text: "99 little bugs in the code. 99 little bugs. Take one down, patch it around. 127 little bugs in the code.", source: "Internet Wisdom", length: 104, group: 1 },
  { id: 90103, text: "A SQL query walks into a bar, walks up to two tables and asks, can I join you?", source: "Internet Wisdom", length: 79, group: 0 },
  { id: 90104, text: "In order to understand recursion, one must first understand recursion.", source: "Anonymous", length: 70, group: 0 },
  { id: 90105, text: "Why do programmers prefer dark mode? Because light attracts bugs.", source: "Internet Wisdom", length: 64, group: 0 },
  { id: 90106, text: "A programmer is a person who fixed a problem that you didn't know you had, in a way you don't understand.", source: "Internet Wisdom", length: 105, group: 1 },
  { id: 90107, text: "I don't always test my code, but when I do, I do it in production.", source: "Internet Wisdom", length: 66, group: 0 },
  { id: 90108, text: "Software and cathedrals are much the same. First we build them, then we pray.", source: "Sam Redwine", length: 77, group: 0 },
  { id: 90109, text: "To err is human, but to really foul things up you need a computer.", source: "Paul R. Ehrlich", length: 66, group: 0 },
  { id: 90110, text: "The generation of random numbers is too important to be left to chance.", source: "Robert R. Coveyou", length: 71, group: 0 },

  // Famous / inspirational
  { id: 90201, text: "Stay hungry. Stay foolish.", source: "Steve Jobs", length: 26, group: 0 },
  { id: 90202, text: "The only way to do great work is to love what you do.", source: "Steve Jobs", length: 53, group: 0 },
  { id: 90203, text: "Innovation distinguishes between a leader and a follower.", source: "Steve Jobs", length: 57, group: 0 },
  { id: 90204, text: "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.", source: "Mark Zuckerberg", length: 90, group: 0 },
  { id: 90205, text: "The biggest risk is not taking any risk. In a world that is changing really quickly, the only strategy that is guaranteed to fail is not taking risks.", source: "Mark Zuckerberg", length: 152, group: 1 },
  { id: 90206, text: "I think it is possible for ordinary people to choose to be extraordinary.", source: "Elon Musk", length: 72, group: 0 },
  { id: 90207, text: "Your most unhappy customers are your greatest source of learning.", source: "Bill Gates", length: 64, group: 0 },
  { id: 90208, text: "The Web as I envisaged it, we have not seen it yet. The future is still so much bigger than the past.", source: "Tim Berners-Lee", length: 101, group: 1 },
  { id: 90209, text: "It has become appallingly obvious that our technology has exceeded our humanity.", source: "Albert Einstein", length: 80, group: 0 },
  { id: 90210, text: "Technology is best when it brings people together.", source: "Matt Mullenweg", length: 50, group: 0 },
];

// ── Build the English collection ────────────────────────────────────

function buildCollection(raw: typeof englishQuotesRaw): QuoteCollection {
  const groups: [number, number][] = (raw.groups ?? [[0, 100], [101, 300], [301, 600], [601, 9999]]) as [number, number][];

  const quotes: Quote[] = (raw.quotes ?? []).map((q) => {
    const length = (q as Record<string, unknown>).length as number;
    let group = 0;
    for (let g = 0; g < groups.length; g++) {
      const [min, max] = groups[g]!;
      if (length >= min && length <= max) {
        group = g;
        break;
      }
    }
    return {
      id: q.id,
      text: q.text,
      source: q.source,
      length,
      group,
    };
  });

  return {
    language: raw.language ?? "english",
    groups,
    quotes,
  };
}

let englishCollection: QuoteCollection | null = null;

function getEnglishQuotes(): QuoteCollection {
  if (englishCollection) return englishCollection;

  // Try the imported JSON first
  if (englishQuotesRaw?.quotes?.length > 0) {
    englishCollection = buildCollection(englishQuotesRaw);
    return englishCollection;
  }

  // Fallback to embedded quotes
  englishCollection = {
    language: "english",
    groups: [[0, 100], [101, 300], [301, 600], [601, 9999]],
    quotes: FALLBACK_QUOTES,
  };
  return englishCollection;
}

// ── Public API ──────────────────────────────────────────────────────

export function loadQuotes(language: string): QuoteCollection {
  if (language === "english") return getEnglishQuotes();

  // For other languages, return fallback quotes
  return {
    language,
    groups: [[0, 100], [101, 300], [301, 600], [601, 9999]],
    quotes: FALLBACK_QUOTES,
  };
}

export function getRandomQuote(
  language: string,
  lengths: QuoteLength[],
): Quote | null {
  const collection = loadQuotes(language);
  if (collection.quotes.length === 0) return null;

  const filtered = lengths.length > 0
    ? collection.quotes.filter((q) => lengths.includes(q.group as QuoteLength))
    : collection.quotes;

  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)]!;
}

export function getQuoteLengthLabel(group: number): string {
  switch (group) {
    case 0: return "short";
    case 1: return "medium";
    case 2: return "long";
    case 3: return "thicc";
    default: return "unknown";
  }
}
