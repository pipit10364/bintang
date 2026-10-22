import { useMemo, useState } from "react";
import { speak, speakAsync } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { COUNT_ITEMS, EN_WORDS, ID_WORDS } from "@/data/numbers";
import { Instruction, praiseThen, tryAgain } from "./Speaker";

const bigBtn = "rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none transition";
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pickItem = () => COUNT_ITEMS[rand(0, COUNT_ITEMS.length - 1)];
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Tiga pilihan angka berbeda (termasuk jawaban), diambil dari sekitar jawaban. */
function numberOptions(answer: number, min: number, max: number): number[] {
  const near: number[] = [];
  for (let k = answer - 3; k <= answer + 3; k++) if (k !== answer && k >= min && k <= max) near.push(k);
  return shuffle([answer, ...shuffle(near).slice(0, 2)]);
}

/* ---------- 1. Kenalan: lihat angka, ketuk gambar untuk menghitung ---------- */
export function NumberIntro({ d, onDone }: { d: number; onDone: () => void }) {
  const item = useMemo(pickItem, []);
  const [tapped, setTapped] = useState<number[]>([]);
  const finished = d === 0 || tapped.length >= d;
  const text =
    d === 0
      ? "Ini angka nol. Nol artinya tidak ada apa apa. Keranjang ini kosong."
      : `Ini angka ${ID_WORDS[d]}. Ketuk gambar satu per satu untuk menghitung!`;

  const tap = (k: number) => {
    if (tapped.includes(k)) return;
    const n = tapped.length + 1;
    setTapped([...tapped, k]);
    speak(n === d ? `${ID_WORDS[n]}! Jadi ada ${ID_WORDS[d]} ${item.name}.` : ID_WORDS[n]);
  };

  return (
    <div className="space-y-5">
      <Instruction text={text} />
      <div className="flex items-center justify-center gap-6">
        <div className="font-display text-[9rem] leading-none text-ink">{d}</div>
        <button
          type="button"
          onClick={() => speak(EN_WORDS[d], { lang: "en-US" })}
          className={cn(bigBtn, "bg-sky px-5 py-3 font-display text-2xl")}
        >
          🇬🇧 {EN_WORDS[d]}
        </button>
      </div>
      {d === 0 ? (
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-dashed border-border text-7xl">
          🧺
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: d }, (_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => tap(k)}
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-3xl bg-card text-5xl",
                tapped.includes(k) && "ring-4 ring-success",
              )}
            >
              {item.emoji}
              {tapped.includes(k) && (
                <span className="absolute -right-1 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-success font-display text-lg text-primary-foreground">
                  {tapped.indexOf(k) + 1}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {finished && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onDone}
            className={cn(bigBtn, "bg-success px-10 py-4 font-display text-3xl text-primary-foreground")}
          >
            Lanjut ▶
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- 2. Ada berapa? (hitung gambar, pilih angka) ---------- */
export function NumberCountStep({ d, onDone }: { d: number; onDone: () => void }) {
  const rounds = useMemo(() => {
    const others = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((n) => n !== d)).slice(0, 2);
    return [d, ...others].map((n) => ({ n, item: pickItem(), options: numberOptions(n, 0, 10) }));
  }, [d]);
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const r = rounds[i];
  const text = r.n === 0 ? `Keranjang ini kosong. Ada berapa ${r.item.name}?` : `Ada berapa ${r.item.name}? Ayo hitung!`;

  const answer = (n: number) => {
    if (locked) return;
    if (n === r.n) {
      setLocked(true);
      setWrong(null);
      praiseThen(() => {
        setLocked(false);
        if (i + 1 < rounds.length) setI(i + 1);
        else onDone();
      });
    } else {
      setWrong(n);
      tryAgain();
    }
  };

  return (
    <div className="space-y-5">
      <Instruction key={i} text={text} />
      <div className="flex min-h-40 flex-wrap items-center justify-center gap-2 rounded-[2rem] bg-butter/50 p-6 text-5xl">
        {r.n === 0 ? (
          <span className="text-7xl">🧺</span>
        ) : (
          Array.from({ length: r.n }, (_, k) => <span key={k}>{r.item.emoji}</span>)
        )}
      </div>
      <div className="flex justify-center gap-4">
        {r.options.map((n) => (
          <button
            key={n}
            type="button"
            disabled={locked}
            onClick={() => answer(n)}
            className={cn(
              bigBtn,
              "h-28 w-28 font-display text-6xl",
              wrong === n ? "bg-rose" : locked && n === r.n ? "bg-mint" : "bg-card",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- 3. Ambil sebanyak angka ---------- */
export function NumberTakeStep({ d, onDone }: { d: number; onDone: () => void }) {
  const item = useMemo(pickItem, []);
  const [taken, setTaken] = useState<boolean[]>(() => Array.from({ length: 10 }, () => false));
  const [locked, setLocked] = useState(false);
  const count = taken.filter(Boolean).length;

  const tap = (k: number) => {
    if (taken[k] || locked) return;
    const n = count + 1;
    setTaken(taken.map((t, j) => (j === k ? true : t)));
    if (n === d) {
      setLocked(true);
      Promise.race([speakAsync(`${ID_WORDS[n]}!`), wait(2000)]).then(() => praiseThen(onDone));
    } else speak(ID_WORDS[n]);
  };

  return (
    <div className="space-y-5">
      <Instruction text={`Ambil ${ID_WORDS[d]} ${item.name} ke keranjang. Ketuk satu per satu ya!`} />
      <div className="grid grid-cols-5 gap-3">
        {taken.map((t, k) => (
          <button
            key={k}
            type="button"
            onClick={() => tap(k)}
            className={cn("flex aspect-square items-center justify-center rounded-3xl bg-card text-5xl", t && "opacity-20")}
          >
            {item.emoji}
          </button>
        ))}
      </div>
      <div className="rounded-[2rem] bg-mint/60 p-4">
        <div className="font-display text-2xl">🧺 {count} / {d}</div>
        <div className="mt-2 flex min-h-16 flex-wrap gap-1 text-4xl">
          {Array.from({ length: count }, (_, k) => (
            <span key={k}>{item.emoji}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 4. Kuis angka ---------- */
type Q = { prompt: string; options: string[]; answer: string; group?: boolean };

function makeQuiz(d: number): Q[] {
  const digitOpts = (ans: number) =>
    shuffle([ans, ...shuffle(Array.from({ length: 10 }, (_, k) => k).filter((k) => k !== ans)).slice(0, 2)]).map(String);
  const q1: Q = { prompt: `Mana angka ${ID_WORDS[d]}?`, options: digitOpts(d), answer: String(d) };
  const after = d < 9;
  const ans2 = after ? d + 1 : d - 1;
  const q2: Q = {
    prompt: after ? `Setelah angka ${ID_WORDS[d]}, angka berapa?` : `Sebelum angka ${ID_WORDS[d]}, angka berapa?`,
    options: digitOpts(ans2),
    answer: String(ans2),
  };
  const a = rand(1, 9);
  let b = rand(1, 9);
  while (Math.abs(a - b) < 2) b = rand(1, 9);
  const e = pickItem().emoji;
  const ga = e.repeat(a);
  const gb = e.repeat(b);
  const q3: Q = { prompt: "Mana yang lebih banyak?", options: shuffle([ga, gb]), answer: a > b ? ga : gb, group: true };
  return [q1, q2, q3];
}

export function NumberQuizStep({ d, onDone }: { d: number; onDone: () => void }) {
  const qs = useMemo(() => makeQuiz(d), [d]);
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const q = qs[i];

  const answer = (o: string) => {
    if (locked) return;
    if (o === q.answer) {
      setLocked(true);
      setWrong(null);
      praiseThen(() => {
        setLocked(false);
        if (i + 1 < qs.length) setI(i + 1);
        else onDone();
      });
    } else {
      setWrong(o);
      tryAgain();
    }
  };

  return (
    <div className="space-y-5">
      <Instruction key={i} text={q.prompt} />
      <div className={cn("grid gap-4", q.group ? "grid-cols-2" : "grid-cols-3")}>
        {q.options.map((o) => (
          <button
            key={o}
            type="button"
            disabled={locked}
            onClick={() => answer(o)}
            className={cn(
              bigBtn,
              "flex items-center justify-center break-all p-3",
              q.group ? "min-h-32 text-4xl" : "h-28 font-display text-6xl",
              wrong === o ? "bg-rose" : locked && o === q.answer ? "bg-mint" : "bg-card",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
