export type Word = { id: string; emoji: string; en: string };
export type Letter = { letter: string; words: Word[] };

const raw: Record<string, [string, string, string][]> = {
  A: [["Apel", "🍎", "apple"], ["Ayam", "🐔", "chicken"], ["Anggur", "🍇", "grapes"], ["Awan", "☁️", "cloud"]],
  B: [["Bola", "⚽", "ball"], ["Bebek", "🦆", "duck"], ["Bunga", "🌸", "flower"], ["Buku", "📖", "book"]],
  C: [["Cacing", "🪱", "worm"], ["Cabai", "🌶️", "chili"], ["Cumi-cumi", "🦑", "squid"], ["Cokelat", "🍫", "chocolate"]],
  D: [["Domba", "🐑", "sheep"], ["Daun", "🍃", "leaf"], ["Dadu", "🎲", "dice"], ["Donat", "🍩", "donut"]],
  E: [["Elang", "🦅", "eagle"], ["Es", "🧊", "ice"], ["Ember", "🪣", "bucket"]],
  F: [["Foto", "📷", "photo"], ["Flamingo", "🦩", "flamingo"], ["Feri", "⛴️", "ferry"]],
  G: [["Gajah", "🐘", "elephant"], ["Gitar", "🎸", "guitar"], ["Gunung", "⛰️", "mountain"], ["Gigi", "🦷", "tooth"]],
  H: [["Harimau", "🐯", "tiger"], ["Hujan", "🌧️", "rain"], ["Hati", "❤️", "heart"], ["Helikopter", "🚁", "helicopter"]],
  I: [["Ikan", "🐟", "fish"], ["Ibu", "👩", "mother"], ["Istana", "🏰", "castle"]],
  J: [["Jeruk", "🍊", "orange"], ["Jagung", "🌽", "corn"], ["Jam", "⏰", "clock"], ["Jamur", "🍄", "mushroom"]],
  K: [["Kucing", "🐱", "cat"], ["Kelinci", "🐰", "rabbit"], ["Kue", "🍰", "cake"], ["Kupu-kupu", "🦋", "butterfly"]],
  L: [["Lebah", "🐝", "bee"], ["Lemon", "🍋", "lemon"], ["Lampu", "💡", "lamp"], ["Lilin", "🕯️", "candle"]],
  M: [["Mobil", "🚗", "car"], ["Monyet", "🐒", "monkey"], ["Matahari", "☀️", "sun"], ["Mangga", "🥭", "mango"]],
  N: [["Nanas", "🍍", "pineapple"], ["Nasi", "🍚", "rice"], ["Naga", "🐉", "dragon"], ["Nyamuk", "🦟", "mosquito"]],
  O: [["Orang utan", "🦧", "orangutan"], ["Ombak", "🌊", "wave"], ["Otak", "🧠", "brain"]],
  P: [["Pisang", "🍌", "banana"], ["Payung", "☂️", "umbrella"], ["Pensil", "✏️", "pencil"], ["Pohon", "🌳", "tree"]],
  Q: [["Quran", "📗", "Quran"], ["Kuis", "❓", "quiz"]],
  R: [["Rumah", "🏠", "house"], ["Roti", "🍞", "bread"], ["Rusa", "🦌", "deer"], ["Roket", "🚀", "rocket"]],
  S: [["Sapi", "🐄", "cow"], ["Semut", "🐜", "ant"], ["Sepatu", "👟", "shoe"], ["Stroberi", "🍓", "strawberry"]],
  T: [["Topi", "🧢", "hat"], ["Tomat", "🍅", "tomato"], ["Telur", "🥚", "egg"], ["Tikus", "🐭", "mouse"]],
  U: [["Ular", "🐍", "snake"], ["Udang", "🦐", "shrimp"], ["Ubi", "🍠", "sweet potato"], ["Unta", "🐪", "camel"]],
  V: [["Vas", "🏺", "vase"], ["Violin", "🎻", "violin"], ["Van", "🚐", "van"]],
  W: [["Wortel", "🥕", "carrot"], ["Warna", "🎨", "colors"], ["Wajah", "🙂", "face"]],
  X: [["Xilofon", "🎵", "xylophone"]],
  Y: [["Yoyo", "🪀", "yo-yo"], ["Yoga", "🧘", "yoga"]],
  Z: [["Zebra", "🦓", "zebra"], ["Zaitun", "🫒", "olive"]],
};

export const LETTERS: Letter[] = Object.entries(raw).map(([letter, ws]) => ({
  letter,
  words: ws.map(([id, emoji, en]) => ({ id, emoji, en })),
}));

export const getLetter = (l: string) => LETTERS.find((x) => x.letter === l.toUpperCase());

/** Letters that children often flip. */
export const CONFUSABLE_GROUPS = [
  ["b", "d", "p", "q"],
  ["u", "n", "m"],
  ["v", "w"],
] as const;

export const CONFUSABLE_TIPS: Record<string, { hint: string; picture: string }> = {
  b: { hint: "b: tongkat dulu, lalu perut bulat di kanan. Seperti bat lalu bola.", picture: "🏏⚽" },
  d: { hint: "d: bola bulat dulu, lalu tongkat di kanan. Seperti drum dan stiknya.", picture: "🥁" },
  p: { hint: "p: tongkat turun ke bawah, perut di atas kanan. Seperti payung terbalik.", picture: "☂️" },
  q: { hint: "q: bola di kiri, ekornya turun ke bawah di kanan.", picture: "🎈" },
  u: { hint: "u: seperti cangkir, terbuka di atas.", picture: "☕" },
  n: { hint: "n: seperti terowongan, satu bukit.", picture: "🚇" },
  m: { hint: "m: dua bukit, seperti unta berpunuk dua.", picture: "🐫" },
  v: { hint: "v: satu lembah runcing.", picture: "🔻" },
  w: { hint: "w: dua lembah runcing, seperti dua v bergandengan.", picture: "🔻🔻" },
};

export function confusableGroupOf(letter: string) {
  const l = letter.toLowerCase();
  return CONFUSABLE_GROUPS.find((g) => (g as readonly string[]).includes(l));
}

/** Gambar yang membingungkan anak (tidak jelas mewakili kata itu), dihindari untuk latihan menulis. */
const VAGUE_PICTURE = new Set(["Kuis", "Wajah", "Warna", "Vas", "Xilofon", "Zaitun", "Quran", "Feri"]);

/**
 * Kata latihan menulis dan membaca keras untuk satu huruf. Anak kelas 1 baru bisa menulis
 * kata pendek dengan gambar yang jelas, jadi dipilih yang paling pendek (satu kata, tanpa spasi
 * atau tanda hubung), gambar yang jelas lebih dulu, dan urutannya dari yang terpendek.
 */
export function drillWords(words: Word[], n = 3): Word[] {
  const letters = (w: Word) => w.id.replace(/[^a-zA-Z]/g, "").length;
  const cost = (w: Word) =>
    letters(w) +
    (/[\s-]/.test(w.id) ? 20 : 0) +
    (VAGUE_PICTURE.has(w.id) ? 8 : 0) +
    (letters(w) > 6 ? 6 : 0);
  return words
    .map((w, i) => ({ w, i, c: cost(w) }))
    .sort((a, b) => a.c - b.c || a.i - b.i)
    .slice(0, n)
    .sort((a, b) => letters(a.w) - letters(b.w) || a.i - b.i)
    .map((x) => x.w);
}
