// Bahan soal untuk "Latihan Seru" (terinspirasi lembar kerja: hubungkan, coding, huruf kembar, abjad,
// suku kata). Murni logika tanpa tampilan, supaya mudah dites.
import { LETTERS } from "@/data/letters";
import { syllabify } from "@/data/syllables";

export const shuffle = <T,>(a: readonly T[]): T[] => {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
export const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** Warna garis hubung dan warna kode: dipilih yang mudah dibedakan. */
export const LINE_COLORS = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa", "#ec407a", "#795548"];

/** Tiga pilihan jawaban angka: jawaban benar dan dua angka di dekatnya (tidak kurang dari `min`). */
export function nearOptions(answer: number, min = 1): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((n) => n >= min);
  return [answer, ...shuffle(near).slice(0, 2)].sort((a, b) => a - b);
}

/* ---------- Hubungkan ---------- */
export type Pair = { id: string; left: string; right: string; say: string; sayRight: string };

const ID_NUM = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh"];

/** Penjumlahan dengan hasil sampai 10; setiap hasil berbeda supaya tidak ada dua jawaban kembar. */
export function sumPairs(n = 5): Pair[] {
  const used = new Set<number>();
  const out: Pair[] = [];
  while (out.length < n) {
    const a = rand(1, 8);
    const b = rand(1, 8);
    const s = a + b;
    if (s > 10 || used.has(s)) continue;
    used.add(s);
    out.push({
      id: `${a}+${b}`,
      left: `${a} + ${b}`,
      right: String(s),
      say: `${ID_NUM[a]} tambah ${ID_NUM[b]}`,
      sayRight: ID_NUM[s],
    });
  }
  return out;
}

/** Kata pendek bergambar yang bisa dipecah jadi 2 sampai 3 suku kata. */
export function easyWords() {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of LETTERS)
    for (const w of l.words) {
      const t = w.id.toLowerCase();
      if (/[\s-]/.test(t) || t.length < 4 || t.length > 7 || seen.has(t)) continue;
      const syl = syllabify(t);
      if (syl.length < 2 || syl.length > 3 || syl.some((s) => s.length > 3)) continue;
      seen.add(t);
      out.push(t);
    }
  return out;
}

/** Suku kata di kiri, kata utuh di kanan ("bo la" ke "bola"). Huruf depan setiap kata berbeda. */
export function wordPairs(n = 5): Pair[] {
  const out: Pair[] = [];
  const firsts = new Set<string>();
  for (const w of shuffle(easyWords())) {
    if (firsts.has(w[0])) continue;
    firsts.add(w[0]);
    out.push({ id: w, left: syllabify(w).join(" "), right: w, say: w, sayRight: w });
    if (out.length === n) break;
  }
  return out;
}

/* ---------- Coding ---------- */
export type Sym = { key: string; glyph: string; name: string; value: number; color?: string };
export type CodeQ = { syms: Sym[]; answer: number; options: number[] };

const PICS = [
  { key: "kupu", glyph: "🦋", name: "kupu-kupu" },
  { key: "bunga", glyph: "🌼", name: "bunga" },
  { key: "pohon", glyph: "🌳", name: "pohon" },
  { key: "hati", glyph: "❤️", name: "hati" },
];
export const COLOR_NAMES = ["merah", "oranye", "kuning", "hijau", "biru", "ungu", "merah muda"];

/** Gambar punya nilai 2 sampai 5, jumlahkan dua gambar. */
export function codePictures(count = 4): { legend: Sym[]; questions: CodeQ[] } {
  const values = shuffle([2, 3, 4, 5]);
  const legend = PICS.map((p, i) => ({ ...p, value: values[i] }));
  const pairs: [Sym, Sym][] = [];
  for (let i = 0; i < legend.length; i++) for (let j = i + 1; j < legend.length; j++) pairs.push(Math.random() < 0.5 ? [legend[i], legend[j]] : [legend[j], legend[i]]);
  const questions = shuffle(pairs)
    .slice(0, count)
    .map(([a, b]) => ({ syms: [a, b], answer: a.value + b.value, options: nearOptions(a.value + b.value) }));
  return { legend, questions };
}

/** Tujuh warna dengan angka berbeda (1 sampai 9), jumlahkan tiga warna. */
export function codeColors(count = 4): { legend: Sym[]; questions: CodeQ[] } {
  const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 7);
  const legend = LINE_COLORS.slice(0, 7).map((c, i) => ({ key: c, glyph: "●", name: COLOR_NAMES[i], value: values[i], color: c }));
  const questions: CodeQ[] = [];
  const seen = new Set<string>();
  while (questions.length < count) {
    const syms = shuffle(legend).slice(0, 3);
    const id = syms.map((s) => s.key).join();
    if (seen.has(id)) continue;
    seen.add(id);
    const answer = syms.reduce((t, s) => t + s.value, 0);
    questions.push({ syms, answer, options: nearOptions(answer) });
  }
  return { legend, questions };
}

/* ---------- Huruf kembar berwarna ---------- */
/** Kode warna tiap huruf dalam satu kelompok (b merah, d oranye, p kuning, q ungu). */
export const LETTER_CODE_COLORS = ["#e53935", "#fb8c00", "#fdd835", "#8e24aa"];
export const LETTER_CODE_NAMES = ["merah", "oranye", "kuning", "ungu"];

export function letterCodes(group: readonly string[]) {
  return group.map((l, i) => ({ letter: l, color: LETTER_CODE_COLORS[i], name: LETTER_CODE_NAMES[i] }));
}

/** Urutan huruf untuk latihan: setiap huruf muncul `rounds` kali, tidak ada yang sama berturut-turut. */
export function letterSequence(group: readonly string[], rounds = 2): string[] {
  let out: string[] = [];
  for (let r = 0; r < rounds; r++) {
    let next = shuffle(group);
    while (out.length && next.length > 1 && next[0] === out[out.length - 1]) next = shuffle(group);
    out = out.concat(next);
  }
  return out;
}

/* ---------- Abjad ---------- */
export const ABC = "abcdefghijklmnopqrstuvwxyz".split("");

/** Posisi huruf yang dikosongkan (acak, tidak kembar). */
export function pickBlanks(n: number, total = 26): number[] {
  return shuffle(Array.from({ length: total }, (_, i) => i))
    .slice(0, n)
    .sort((a, b) => a - b);
}

/* ---------- Suku kata ---------- */
export const CONSONANTS = "bcdfghjklmnprstvwyz".split("");
export const VOWELS = ["a", "i", "u", "e", "o"];

export type SylQ = { target: string; options: string[] };

/** Dengar suku kata, pilih tulisannya. Pilihan: satu dengan konsonan sama, satu dengan vokal sama, satu bebas. */
export function syllableQuiz(n = 6): SylQ[] {
  const out: SylQ[] = [];
  const used = new Set<string>();
  while (out.length < n) {
    const c = CONSONANTS[rand(0, CONSONANTS.length - 1)];
    const v = VOWELS[rand(0, VOWELS.length - 1)];
    const target = c + v;
    if (used.has(target)) continue;
    used.add(target);
    const sameC = c + shuffle(VOWELS.filter((x) => x !== v))[0];
    const sameV = shuffle(CONSONANTS.filter((x) => x !== c))[0] + v;
    const taken = new Set([target, sameC, sameV]);
    const free = shuffle(CONSONANTS.flatMap((x) => VOWELS.map((y) => x + y)).filter((s) => !taken.has(s)))[0];
    out.push({ target, options: shuffle([target, sameC, sameV, free]) });
  }
  return out;
}
