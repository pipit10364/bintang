export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const ID_WORDS = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh"];
export const EN_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export const COUNT_ITEMS = [
  { emoji: "🍎", name: "apel" },
  { emoji: "⭐", name: "bintang" },
  { emoji: "🐟", name: "ikan" },
  { emoji: "🚗", name: "mobil" },
  { emoji: "🌸", name: "bunga" },
  { emoji: "🐱", name: "kucing" },
  { emoji: "🎈", name: "balon" },
  { emoji: "🍪", name: "kue" },
];

// Garis tulis angka dalam kotak 100x100, urut dan searah penulisan.
export const DIGIT_STROKES: Record<number, string[]> = {
  0: ["M50 10 C20 10 20 90 50 90 C80 90 80 10 50 10"],
  1: ["M32 28 L52 10 L52 90"],
  2: ["M24 30 C24 5 76 5 76 32 C76 52 40 70 24 90 L78 90"],
  3: ["M26 20 C32 4 74 6 74 28 C74 44 54 48 42 48 C60 48 80 54 80 72 C80 96 28 98 22 76"],
  4: ["M62 10 L20 62 L82 62", "M62 10 L62 90"],
  5: ["M30 10 L26 48 C52 38 80 46 80 68 C80 96 36 98 22 80", "M30 10 L74 10"],
  6: ["M70 14 C40 18 22 40 22 66 C22 100 78 100 78 68 C78 40 30 40 24 62"],
  7: ["M22 12 L78 12 L40 90"],
  8: ["M50 50 C20 44 24 10 50 10 C76 10 80 44 50 50 C16 56 20 92 50 92 C80 92 84 56 50 50"],
  9: ["M72 36 C72 6 24 6 24 34 C24 62 72 62 72 36", "M72 36 L72 70 C72 92 42 96 28 86"],
};

export const isDigit = (s: string) => /^[0-9]$/.test(s);
export const keycap = (d: number) => `${d}\uFE0F\u20E3`;
