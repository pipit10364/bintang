// Bentuk dasar untuk anak: nama, jumlah sisi, dan contoh benda di sekitar.
export type ShapeId =
  | "lingkaran"
  | "persegi"
  | "persegipanjang"
  | "segitiga"
  | "bintang"
  | "hati"
  | "oval"
  | "belahketupat";

export type Shape = {
  id: ShapeId;
  name: string; // nama bahasa Indonesia
  en: string;
  color: string; // kelas warna latar
  fact: string; // dibacakan saat dikenalkan
  examples: { emoji: string; name: string }[];
};

export const SHAPES: Shape[] = [
  {
    id: "lingkaran",
    name: "Lingkaran",
    en: "circle",
    color: "bg-sky",
    fact: "Lingkaran itu bulat, tidak punya sudut dan tidak punya sisi lurus.",
    examples: [
      { emoji: "⚽", name: "bola" },
      { emoji: "⏰", name: "jam" },
      { emoji: "🍪", name: "kue" },
    ],
  },
  {
    id: "persegi",
    name: "Persegi",
    en: "square",
    color: "bg-butter",
    fact: "Persegi punya empat sisi yang sama panjang dan empat sudut.",
    examples: [
      { emoji: "🎲", name: "dadu" },
      { emoji: "🪟", name: "jendela" },
      { emoji: "🧇", name: "wafel" },
    ],
  },
  {
    id: "persegipanjang",
    name: "Persegi panjang",
    en: "rectangle",
    color: "bg-mint",
    fact: "Persegi panjang punya empat sisi. Dua sisi panjang dan dua sisi pendek.",
    examples: [
      { emoji: "🚪", name: "pintu" },
      { emoji: "📱", name: "ponsel" },
      { emoji: "📖", name: "buku" },
    ],
  },
  {
    id: "segitiga",
    name: "Segitiga",
    en: "triangle",
    color: "bg-peach",
    fact: "Segitiga punya tiga sisi dan tiga sudut.",
    examples: [
      { emoji: "🍕", name: "pizza" },
      { emoji: "⛺", name: "tenda" },
      { emoji: "🚩", name: "bendera" },
    ],
  },
  {
    id: "bintang",
    name: "Bintang",
    en: "star",
    color: "bg-lilac",
    fact: "Bintang punya lima ujung yang runcing, seperti bintang di langit.",
    examples: [
      { emoji: "⭐", name: "bintang" },
      { emoji: "🌟", name: "bintang bersinar" },
      { emoji: "🎖️", name: "medali" },
    ],
  },
  {
    id: "hati",
    name: "Hati",
    en: "heart",
    color: "bg-rose",
    fact: "Bentuk hati dipakai untuk menunjukkan sayang.",
    examples: [
      { emoji: "❤️", name: "hati" },
      { emoji: "🍓", name: "stroberi" },
      { emoji: "🎁", name: "hadiah" },
    ],
  },
  {
    id: "oval",
    name: "Oval",
    en: "oval",
    color: "bg-sky",
    fact: "Oval itu bulat yang agak lonjong, seperti telur.",
    examples: [
      { emoji: "🥚", name: "telur" },
      { emoji: "🍉", name: "semangka" },
      { emoji: "🥑", name: "alpukat" },
    ],
  },
  {
    id: "belahketupat",
    name: "Belah ketupat",
    en: "diamond",
    color: "bg-butter",
    fact: "Belah ketupat punya empat sisi sama panjang, tapi berdiri miring seperti layang layang.",
    examples: [
      { emoji: "🪁", name: "layang layang" },
      { emoji: "💎", name: "berlian" },
      { emoji: "♦️", name: "wajik" },
    ],
  },
];

export const getShape = (id: ShapeId) => SHAPES.find((s) => s.id === id)!;

/** Soal benda sehari hari: benda apa berbentuk apa. */
export const SHAPE_OBJECTS: { emoji: string; name: string; shape: ShapeId }[] = SHAPES.flatMap(
  (s) => s.examples.slice(0, 2).map((e) => ({ emoji: e.emoji, name: e.name, shape: s.id })),
);

/** Nama satu kata yang bisa diketik anak. */
export const TYPEABLE: ShapeId[] = ["lingkaran", "persegi", "segitiga", "bintang", "oval", "hati"];
