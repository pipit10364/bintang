// Bahan soal "Latihan Seru" dengan 10 level per tema (terinspirasi lembar kerja: hubungkan, coding,
// huruf kembar, abjad, suku kata). Murni logika tanpa tampilan, supaya mudah dites.
import { LETTERS } from "@/data/letters";
import { syllabify } from "@/data/syllables";

export const LEVELS = 10;
export const clampLevel = (l: number) => Math.min(LEVELS, Math.max(1, Math.round(l)));
/** Ambil nilai untuk level 1..10 dari daftar 10 nilai. */
const at = <T,>(list: readonly T[], level: number): T => list[clampLevel(level) - 1];

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

/** Angka dalam kata Indonesia (0 sampai 99) untuk dibacakan. */
const ONES = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
export function idNum(n: number): string {
  if (n < 10) return ONES[n];
  if (n === 10) return "sepuluh";
  if (n === 11) return "sebelas";
  if (n < 20) return `${ONES[n - 10]} belas`;
  const t = `${ONES[Math.floor(n / 10)]} puluh`;
  return n % 10 ? `${t} ${ONES[n % 10]}` : t;
}

/** Pilihan jawaban angka: jawaban benar dan angka di dekatnya (tidak kurang dari `min`). */
export function nearOptions(answer: number, count = 3, min = 1): number[] {
  const near = [answer - 3, answer - 2, answer - 1, answer + 1, answer + 2, answer + 3].filter((n) => n >= min);
  const close = shuffle(near.filter((n) => Math.abs(n - answer) <= 2)).concat(shuffle(near.filter((n) => Math.abs(n - answer) > 2)));
  return [answer, ...close.slice(0, count - 1)].sort((a, b) => a - b);
}

/* ---------- Hubungkan ---------- */
export type Pair = { id: string; left: string; right: string; say: string; sayRight: string };

const MAX_SUM = [5, 6, 8, 10, 10, 12, 14, 16, 18, 20];
const PAIR_COUNT = [3, 3, 4, 4, 4, 5, 5, 5, 5, 5];

/** Hitungan: level 1 sampai 5 penjumlahan, level 6 ke atas ditambah pengurangan (hasil selalu minimal 1). */
export function mathPairs(level: number): Pair[] {
  const n = at(PAIR_COUNT, level);
  const max = at(MAX_SUM, level);
  const used = new Set<number>();
  const out: Pair[] = [];
  while (out.length < n) {
    const minus = clampLevel(level) >= 6 && Math.random() < 0.4;
    let a: number, b: number, r: number;
    if (minus) {
      a = rand(3, max);
      b = rand(1, a - 1);
      r = a - b;
    } else {
      a = rand(1, max - 1);
      b = rand(1, max - a);
      r = a + b;
    }
    if (r < 1 || used.has(r)) continue;
    used.add(r);
    out.push({
      id: `${a}${minus ? "-" : "+"}${b}`,
      left: `${a} ${minus ? "−" : "+"} ${b}`,
      right: String(r),
      say: `${idNum(a)} ${minus ? "kurang" : "tambah"} ${idNum(b)}`,
      sayRight: idNum(r),
    });
  }
  return out;
}

/** Kata bergambar tanpa spasi atau tanda hubung, beserta suku katanya. */
export function wordPool() {
  const seen = new Set<string>();
  const out: { w: string; syl: string[] }[] = [];
  for (const l of LETTERS)
    for (const x of l.words) {
      const w = x.id.toLowerCase();
      if (/[\s-]|q/.test(w) || w.length < 4 || w.length > 8 || seen.has(w)) continue;
      const syl = syllabify(w);
      if (syl.length < 2 || syl.length > 3 || syl.some((s) => s.length > 3)) continue;
      seen.add(w);
      out.push({ w, syl });
    }
  return out;
}

/** Kata yang cocok untuk satu level: makin tinggi, makin panjang. */
export function wordsForLevel(level: number) {
  const l = clampLevel(level);
  const all = wordPool();
  if (l <= 3) return all.filter((x) => x.syl.length === 2 && x.w.length <= 5);
  if (l <= 6) return all.filter((x) => x.syl.length === 2);
  if (l <= 8) return all.filter((x) => x.syl.length === 3);
  return all;
}

/** Suku kata di kiri, kata utuh di kanan ("bo la" ke "bola"). Level 1 sampai 8: huruf depan setiap kata berbeda. */
export function wordPairs(level: number): Pair[] {
  const n = at(PAIR_COUNT, level);
  const distinct = clampLevel(level) <= 8;
  const out: Pair[] = [];
  const firsts = new Set<string>();
  for (const { w, syl } of shuffle(wordsForLevel(level))) {
    if (distinct && firsts.has(w[0])) continue;
    firsts.add(w[0]);
    out.push({ id: w, left: syl.join(" "), right: w, say: w, sayRight: w });
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

const QCOUNT = [4, 4, 4, 5, 5, 5, 5, 5, 6, 6];
const PIC_MAX = [4, 4, 5, 5, 6, 6, 7, 7, 8, 9];

/** Gambar punya nilai; level 1 sampai 6 menjumlahkan dua gambar, level 7 ke atas tiga gambar. */
export function codePictures(level: number): { legend: Sym[]; questions: CodeQ[] } {
  const max = at(PIC_MAX, level);
  const values = shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, 4);
  const legend = PICS.map((p, i) => ({ ...p, value: values[i] }));
  const k = clampLevel(level) >= 7 ? 3 : 2;
  const seen = new Set<string>();
  const questions: CodeQ[] = [];
  const total = at(QCOUNT, level);
  while (questions.length < total) {
    const syms = shuffle(legend).slice(0, k);
    const id = syms.map((s) => s.key).join();
    if (seen.has(id) && seen.size < 6) continue;
    seen.add(id);
    const answer = syms.reduce((t, s) => t + s.value, 0);
    questions.push({ syms, answer, options: nearOptions(answer, k === 2 ? 3 : 4) });
  }
  return { legend, questions };
}

const COLOR_COUNT = [4, 4, 5, 5, 5, 7, 7, 7, 7, 7];
const COLOR_MAX = [4, 5, 5, 6, 6, 7, 8, 9, 9, 9];
const COLOR_TERMS = [2, 2, 2, 3, 3, 3, 3, 3, 4, 4];

/** Warna punya angka berbeda; makin tinggi level, makin banyak warna dan suku yang dijumlahkan. */
export function codeColors(level: number): { legend: Sym[]; questions: CodeQ[] } {
  const count = at(COLOR_COUNT, level);
  const max = at(COLOR_MAX, level);
  const terms = at(COLOR_TERMS, level);
  const values = shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, count);
  const legend = LINE_COLORS.slice(0, count).map((c, i) => ({
    key: c, glyph: "●", name: COLOR_NAMES[i], value: values[i], color: c,
  }));
  const questions: CodeQ[] = [];
  const seen = new Set<string>();
  const total = at(QCOUNT, level);
  while (questions.length < total) {
    const syms = shuffle(legend).slice(0, terms);
    const id = syms.map((s) => s.key).join();
    if (seen.has(id)) continue;
    seen.add(id);
    const answer = syms.reduce((t, s) => t + s.value, 0);
    questions.push({ syms, answer, options: nearOptions(answer, terms >= 3 ? 4 : 3) });
  }
  return { legend, questions };
}

/* ---------- Huruf kembar berwarna ---------- */
/** Kode warna tiap huruf (b merah, d oranye, p kuning, q ungu, lalu hijau dan biru). */
export const LETTER_CODE_COLORS = ["#e53935", "#fb8c00", "#fdd835", "#8e24aa", "#43a047", "#1e88e5"];
export const LETTER_CODE_NAMES = ["merah", "oranye", "kuning", "ungu", "hijau", "biru"];

export function letterCodes(group: readonly string[]) {
  return group.map((l, i) => ({ letter: l, color: LETTER_CODE_COLORS[i], name: LETTER_CODE_NAMES[i] }));
}

/** Urutan huruf: tiap huruf muncul `rounds` kali, tidak ada yang sama berturut-turut. */
export function letterSequence(group: readonly string[], rounds = 2): string[] {
  let out: string[] = [];
  for (let r = 0; r < rounds; r++) {
    let next = shuffle(group);
    while (out.length && next.length > 1 && next[0] === out[out.length - 1]) next = shuffle(group);
    out = out.concat(next);
  }
  return out;
}

export const APPLE_LEVELS: { group: string[]; rounds: number }[] = [
  { group: ["b", "d"], rounds: 3 },
  { group: ["p", "q"], rounds: 3 },
  { group: ["b", "p"], rounds: 4 },
  { group: ["d", "q"], rounds: 4 },
  { group: ["b", "d", "p"], rounds: 3 },
  { group: ["b", "d", "p", "q"], rounds: 2 },
  { group: ["b", "d", "p", "q"], rounds: 3 },
  { group: ["u", "n", "m"], rounds: 3 },
  { group: ["u", "n", "m", "v", "w"], rounds: 2 },
  { group: ["b", "d", "p", "q", "n", "m"], rounds: 2 },
];
export const appleLevel = (level: number) => at(APPLE_LEVELS, level);

/* ---------- Lingkari huruf yang sama ---------- */
export type CircleCfg = { pool: string[]; cells: number; hits: number; rounds: number };
export const CIRCLE_LEVELS: CircleCfg[] = [
  { pool: ["b", "d"], cells: 8, hits: 3, rounds: 2 },
  { pool: ["p", "q"], cells: 8, hits: 3, rounds: 2 },
  { pool: ["b", "p"], cells: 8, hits: 3, rounds: 3 },
  { pool: ["d", "q"], cells: 8, hits: 3, rounds: 3 },
  { pool: ["b", "d", "p"], cells: 12, hits: 4, rounds: 3 },
  { pool: ["b", "d", "p", "q"], cells: 12, hits: 4, rounds: 3 },
  { pool: ["u", "n", "m"], cells: 12, hits: 4, rounds: 3 },
  { pool: ["b", "d", "p", "q"], cells: 16, hits: 5, rounds: 3 },
  { pool: ["b", "d", "p", "q", "u", "n", "m"], cells: 16, hits: 5, rounds: 4 },
  { pool: ["b", "d", "p", "q", "u", "n", "m", "v", "w"], cells: 20, hits: 6, rounds: 4 },
];
export const circleLevel = (level: number) => at(CIRCLE_LEVELS, level);

/** Huruf target tiap putaran: dari kelompok, tidak sama dua kali berturut-turut. */
export function pickTargets(pool: readonly string[], rounds: number): string[] {
  const out: string[] = [];
  let bag: string[] = [];
  while (out.length < rounds) {
    if (!bag.length) bag = shuffle(pool);
    const next = bag.shift()!;
    if (next === out[out.length - 1] && pool.length > 1) {
      bag.push(next);
      continue;
    }
    out.push(next);
  }
  return out;
}

/** Isi kotak: `hits` huruf target, sisanya huruf lain dari kelompok yang sama. */
export function circleCells(pool: readonly string[], target: string, cells: number, hits: number): string[] {
  const others = pool.filter((p) => p !== target);
  const rest = Array.from({ length: cells - hits }, (_, i) => others[i % others.length]);
  return shuffle([...Array(hits).fill(target), ...rest]);
}

/* ---------- Abjad ---------- */
export const ABC = "abcdefghijklmnopqrstuvwxyz".split("");
const BLANKS = [3, 4, 6, 8, 10, 12, 14, 16, 18, 20];
export const blankCount = (level: number) => at(BLANKS, level);

/** Posisi huruf yang dikosongkan (acak, tidak kembar). */
export function pickBlanks(n: number, total = 26): number[] {
  return shuffle(Array.from({ length: total }, (_, i) => i))
    .slice(0, n)
    .sort((a, b) => a - b);
}

/* ---------- Suku kata ---------- */
export const CONSONANTS = "bcdfghjklmnprstvwyz".split("");
export const VOWELS = ["a", "i", "u", "e", "o"];
const EASY_C = ["b", "d", "k", "l", "m", "p", "s", "t"];

/** Baris konsonan tiap level untuk tabel suku kata: 19 konsonan terbagi ke 9 level, level 10 adalah ulangan. */
export const TABLE_LEVELS: string[][] = [
  ["b", "c"], ["d", "f"], ["g", "h"], ["j", "k"], ["l", "m"], ["n", "p"], ["r", "s"], ["t", "v"], ["w", "y"],
  ["b", "m", "s", "z"],
];
export const tableRows = (level: number) => at(TABLE_LEVELS, level);

const CONFUSE: Record<string, string[]> = {
  b: ["d", "p"], d: ["b", "t"], p: ["b", "t"], m: ["n"], n: ["m"], k: ["g", "t"], g: ["k"], t: ["d", "p", "k"],
  v: ["f", "w"], f: ["v"], w: ["v"], c: ["k", "s"], s: ["c", "z"], z: ["s"], l: ["r"], r: ["l"], j: ["c"],
};

export type SylQ = { target: string; options: string[] };
const OPT_COUNT = [2, 2, 3, 3, 4, 4, 4, 4, 4, 4];
const SYL_COUNT = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8];

/**
 * Dengar suku kata, pilih tulisannya.
 * Level 1-6: pilihan acak (makin banyak). Level 7-8: ada yang konsonannya sama dan vokalnya sama.
 * Level 9-10: pilihan yang paling mirip (konsonan mirip seperti b-d, m-n, k-g).
 */
export function syllableQuiz(level: number): SylQ[] {
  const l = clampLevel(level);
  const n = at(SYL_COUNT, l);
  const count = at(OPT_COUNT, l);
  const cons = l <= 3 ? EASY_C : CONSONANTS;
  const out: SylQ[] = [];
  const used = new Set<string>();
  while (out.length < n) {
    const c = cons[rand(0, cons.length - 1)];
    const v = VOWELS[rand(0, VOWELS.length - 1)];
    const target = c + v;
    if (used.has(target)) continue;
    used.add(target);
    const prefer: string[] = [];
    if (l >= 7) {
      prefer.push(c + shuffle(VOWELS.filter((x) => x !== v))[0]);
      prefer.push(shuffle(cons.filter((x) => x !== c))[0] + v);
    }
    if (l >= 9) {
      for (const x of shuffle(CONFUSE[c] ?? [])) prefer.push(x + v);
      prefer.push(c + shuffle(VOWELS.filter((x) => x !== v))[1 % 4]);
    }
    const rest = shuffle(cons.flatMap((x) => VOWELS.map((y) => x + y)));
    const opts: string[] = [target];
    for (const s of [...prefer, ...rest]) {
      if (opts.length >= count) break;
      if (!opts.includes(s)) opts.push(s);
    }
    out.push({ target, options: shuffle(opts) });
  }
  return out;
}

/* ---------- Isi titik suku kata ---------- */
export type DotKind = "v" | "c" | "both" | "tree";
export type DotQ = {
  kind: DotKind;
  target: string; // suku kata utuh, misalnya "ba" (untuk "tree": konsonannya saja)
  options: string[]; // pilihan langkah pertama (vokal, atau konsonan untuk "c" dan "both")
  options2?: string[]; // pilihan langkah kedua untuk "both" (vokal)
};
export const DOT_LEVELS: { kind: DotKind; n: number; opts: number; easy: boolean; vowels?: string[] }[] = [
  { kind: "v", n: 5, opts: 3, easy: true, vowels: ["a", "i", "u"] },
  { kind: "v", n: 6, opts: 5, easy: true },
  { kind: "v", n: 6, opts: 5, easy: false },
  { kind: "c", n: 5, opts: 3, easy: true },
  { kind: "c", n: 6, opts: 4, easy: false },
  { kind: "c", n: 8, opts: 6, easy: false },
  { kind: "tree", n: 2, opts: 5, easy: true },
  { kind: "tree", n: 3, opts: 5, easy: false },
  { kind: "both", n: 5, opts: 4, easy: false },
  { kind: "both", n: 8, opts: 6, easy: false },
];
export const dotLevel = (level: number) => at(DOT_LEVELS, level);

export function fillDots(level: number): DotQ[] {
  const cfg = dotLevel(level);
  const cons = cfg.easy ? EASY_C : CONSONANTS;
  const vow = cfg.vowels ?? VOWELS;
  if (cfg.kind === "tree") return shuffle(cons).slice(0, cfg.n).map((c) => ({ kind: "tree", target: c, options: [...VOWELS] }));
  const out: DotQ[] = [];
  const used = new Set<string>();
  while (out.length < cfg.n) {
    const c = cons[rand(0, cons.length - 1)];
    const v = vow[rand(0, vow.length - 1)];
    const t = c + v;
    if (used.has(t)) continue;
    used.add(t);
    if (cfg.kind === "v") out.push({ kind: "v", target: t, options: shuffle(vow) });
    else {
      const others = shuffle(CONSONANTS.filter((x) => x !== c)).slice(0, cfg.opts - 1);
      out.push({
        kind: cfg.kind,
        target: t,
        options: shuffle([c, ...others]),
        options2: cfg.kind === "both" ? [...VOWELS] : undefined,
      });
    }
  }
  return out;
}
