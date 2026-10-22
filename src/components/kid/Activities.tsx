import { useMemo, useState } from "react";
import { speak } from "@/lib/speech";
import { CONFUSABLE_TIPS, LETTERS, type Letter } from "@/data/letters";
import type { Profile } from "@/lib/store";
import { Instruction, praiseThen, tryAgain, useGateReady, WRONG_PAUSE_MS } from "./Speaker";
import { TraceLetter } from "./Trace";
import { LOWER, UPPER } from "@/data/strokes";
import { QUIZ_BANK, markSeen, pickQuestions, type QuizQ } from "@/data/quiz";
import { vibrateNo, vibrateOk } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const bigBtn =
  "rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none transition";

/** Reaksi salah yang lembut: getar pelan, suara tenang, tombol terkunci sebentar. */
function useWrongPause() {
  const [cool, setCool] = useState(false);
  const wrong = (onWrong?: () => void) => {
    onWrong?.();
    setCool(true);
    tryAgain();
    setTimeout(() => setCool(false), WRONG_PAUSE_MS);
  };
  return { cool, wrong };
}

/* ---------- Tracing ---------- */
export function TraceStep({ letter, onDone }: { letter: string; onDone: (perfect?: boolean) => void }) {
  const variants = [UPPER[letter], LOWER[letter.toLowerCase()]].filter(Boolean) as string[][];
  const labels = [letter, letter.toLowerCase()];
  const [i, setI] = useState(0);
  const text = `Ayo menulis huruf ${letter}${i === 1 ? " kecil" : " besar"}. Mulai dari titik hijau, ikuti arah panah ya.`;
  return (
    <div className="flex flex-col items-center gap-4">
      <Instruction text={text} />
      <div className="font-display text-3xl">
        Huruf <span className="text-ink">{labels[i]}</span>
      </div>
      <TraceLetter
        key={i}
        strokes={variants[i]}
        onDone={() => (i + 1 < variants.length ? setI(i + 1) : onDone(true))}
      />
    </div>
  );
}

/* ---------- b d p q / u n m / v w ---------- */
export function ConfusableStep({
  group,
  onDone,
}: {
  group: readonly string[];
  onDone: (perfect?: boolean) => void;
}) {
  const rounds = useMemo(() => shuffle([...group, ...group]).slice(0, 4), [group]);
  const [r, setR] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [learned, setLearned] = useState(false);
  const [perfect, setPerfect] = useState(true);
  const { cool, wrong: markWrong } = useWrongPause();
  const ready = useGateReady();
  const target = rounds[r];
  const options = useMemo(() => shuffle([...group]), [group, r]);

  if (!learned)
    return (
      <div className="space-y-4">
        <Instruction text="Huruf ini mirip sekali! Ketuk setiap huruf untuk mendengar cara mengingatnya." />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {group.map((l) => (
            <button
              key={l}
              onClick={() => speak(CONFUSABLE_TIPS[l].hint)}
              className={cn(bigBtn, "bg-lilac p-4 text-center")}
            >
              <div className="font-display text-8xl leading-none">{l}</div>
              <div className="mt-2 text-4xl">{CONFUSABLE_TIPS[l].picture}</div>
              <div className="mt-2 text-sm text-muted-foreground">{CONFUSABLE_TIPS[l].hint}</div>
            </button>
          ))}
        </div>
        {group.includes("b") && (
          <div className="rounded-3xl bg-butter/60 p-4 text-center font-display text-xl">
            👍 Trik tangan: kepalkan kedua tangan, jempol ke atas. Tangan kiri jadi <b>b</b>, tangan kanan jadi{" "}
            <b>d</b> — seperti kata "bed" 🛏️
          </div>
        )}
        <button
          onClick={() => setLearned(true)}
          className={cn(bigBtn, "h-20 w-full bg-success font-display text-3xl text-primary-foreground")}
        >
          Ayo main! ▶
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      <Instruction key={r} text={`Ketuk huruf ${target}. ${CONFUSABLE_TIPS[target].hint}`} />
      <div className="flex flex-wrap justify-center gap-4">
        {options.map((l) => (
          <button
            key={l + r}
            disabled={!ready || cool}
            onClick={() => {
              if (l === target) {
                praiseThen(() => (r + 1 < rounds.length ? setR(r + 1) : onDone(perfect)));
              } else {
                markWrong(() => setPerfect(false));
                setWrong(l);
                speak(`Itu huruf ${l}. ${CONFUSABLE_TIPS[target].hint}`);
                setTimeout(() => setWrong(null), 900);
              }
            }}
            className={cn(
              bigBtn,
              "h-32 w-32 bg-sky font-display text-8xl sm:h-36 sm:w-36",
              (!ready || cool) && "opacity-60",
              wrong === l && "animate-wiggle bg-rose",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {r + 1} / {rounds.length}
      </p>
    </div>
  );
}

/* ---------- Detektif kata ---------- */
export function DetectiveStep({ data, onDone }: { data: Letter; onDone: (perfect?: boolean) => void }) {
  const items = useMemo(() => {
    const targets = data.words.slice(0, 3);
    const others = shuffle(
      LETTERS.filter((l) => l.letter !== data.letter).flatMap((l) => l.words),
    ).slice(0, 6 - targets.length);
    return shuffle([...targets, ...others]);
  }, [data]);
  const goal = items.filter((w) => w.id[0].toUpperCase() === data.letter).length;
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [phase, setPhase] = useState<"find" | "read">("find");
  const [perfect, setPerfect] = useState(true);
  const { cool, wrong: markWrong } = useWrongPause();
  const ready = useGateReady();

  if (phase === "read")
    return (
      <div className="space-y-4">
        <Instruction text={`Ketuk gambarnya untuk membaca. Ketuk bendera untuk bahasa Inggris!`} />
        <div className="grid gap-4 md:grid-cols-2">
          {data.words.map((w) => (
            <div key={w.id} className="flex items-center gap-3 rounded-3xl bg-card p-3 sm:gap-4 sm:p-4">
              <button onClick={() => speak(w.id)} className={cn(bigBtn, "h-20 w-20 shrink-0 bg-peach text-5xl sm:h-24 sm:w-24 sm:text-6xl")}>
                {w.emoji}
              </button>
              <div className="min-w-0 flex-1">
                <div className="font-display text-3xl break-words sm:text-4xl">
                  <span className="text-ink">{w.id[0]}</span>
                  {w.id.slice(1)}
                </div>
                <div className="truncate font-display text-lg text-muted-foreground sm:text-xl">{w.en}</div>
              </div>
              <button
                onClick={() => speak(w.en, { lang: "en-US" })}
                className={cn(bigBtn, "h-14 w-14 shrink-0 bg-sky text-2xl sm:h-16 sm:w-16 sm:text-3xl")}
                aria-label="English"
              >
                🇬🇧
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => onDone(perfect)}
          className={cn(bigBtn, "h-20 w-full bg-success font-display text-3xl text-primary-foreground")}
        >
          Lanjut ▶
        </button>
      </div>
    );

  return (
    <div className="space-y-5">
      <Instruction text={`Detektif kata! 🔎 Temukan ${goal} benda yang berawalan huruf ${data.letter}.`} />
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {items.map((w) => {
          const ok = found.includes(w.id);
          return (
            <button
              key={w.id}
              disabled={(!ready || cool) && !ok}
              onClick={() => {
                if (ok) return;
                if (w.id[0].toUpperCase() === data.letter) {
                  const nf = [...found, w.id];
                  setFound(nf);
                  vibrateOk();
                  speak(`${w.id}! Berawalan ${data.letter}.`);
                  if (nf.length >= goal) setTimeout(() => praiseThen(() => setPhase("read")), 1500);
                } else {
                  markWrong(() => setPerfect(false));
                  setWrong(w.id);
                  speak(`${w.id}. Itu berawalan ${w.id[0]}.`);
                  setTimeout(() => setWrong(null), 900);
                }
              }}
              className={cn(
                bigBtn,
                "flex aspect-square flex-col items-center justify-center bg-card text-5xl sm:text-6xl md:text-7xl",
                ok && "animate-pop bg-mint",
                wrong === w.id && "animate-wiggle bg-rose",
                (!ready || cool) && !ok && "opacity-60",
              )}
            >
              {w.emoji}
              {ok && <span className="mt-1 font-display text-lg sm:text-xl">{w.id}</span>}
            </button>
          );
        })}
      </div>
      <p className="text-center text-3xl">
        {"🔍".repeat(found.length)}
        {"⚪".repeat(Math.max(goal - found.length, 0))}
      </p>
    </div>
  );
}

/* ---------- Berhitung ---------- */
export function makeMathQuestion(seed?: number) {
  const plus = (seed ?? Math.random()) > 0.5;
  const a = 1 + Math.floor(Math.random() * 5);
  const b = 1 + Math.floor(Math.random() * (plus ? 5 : a));
  const res = plus ? a + b : a - b;
  return { a, b: plus ? b : Math.min(b, a), plus, res };
}

export function MathStep({ emoji, onDone }: { emoji: string; onDone: (perfect?: boolean) => void }) {
  const qs = useMemo(() => [makeMathQuestion(0.9), makeMathQuestion(0.1), makeMathQuestion()], []);
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [perfect, setPerfect] = useState(true);
  const { cool, wrong: markWrong } = useWrongPause();
  const ready = useGateReady();
  const q = qs[i];
  const opts = useMemo(
    () => Array.from(new Set([q.res, q.res + 1, q.res > 0 ? q.res - 1 : q.res + 2])).sort((x, y) => x - y),
    [q],
  );
  const text = q.plus
    ? `Ada ${q.a} ditambah ${q.b} lagi. Jadi berapa semuanya?`
    : `Ada ${q.a}. Diambil ${q.b}. Sisa berapa?`;

  return (
    <div className="space-y-5">
      <Instruction key={i} text={text} />
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-[2rem] bg-butter/50 p-4 sm:p-6">
        <div className="flex max-w-[45%] flex-wrap justify-center gap-1 text-4xl sm:text-5xl">
          {Array.from({ length: q.a }, (_, k) => (
            <span key={k} className={cn(!q.plus && k >= q.a - q.b && "opacity-25 line-through")}>
              {emoji}
            </span>
          ))}
        </div>
        <span className="font-display text-5xl text-ink sm:text-6xl">{q.plus ? "+" : "−"}</span>
        {q.plus ? (
          <div className="flex max-w-[45%] flex-wrap justify-center gap-1 text-4xl sm:text-5xl">
            {Array.from({ length: q.b }, (_, k) => (
              <span key={k}>{emoji}</span>
            ))}
          </div>
        ) : (
          <span className="font-display text-5xl sm:text-6xl">{q.b}</span>
        )}
      </div>
      <div className="text-center font-display text-4xl sm:text-5xl">
        {q.a} {q.plus ? "+" : "−"} {q.b} = ?
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {opts.map((n) => (
          <button
            key={n}
            disabled={!ready || cool}
            onClick={() => {
              if (n === q.res) {
                praiseThen(() => (i + 1 < qs.length ? setI(i + 1) : onDone(perfect)));
              } else {
                markWrong(() => setPerfect(false));
                setWrong(n);
                setTimeout(() => setWrong(null), 900);
              }
            }}
            className={cn(
              bigBtn,
              "h-24 w-24 bg-sky font-display text-5xl sm:h-28 sm:w-28 sm:text-6xl",
              (!ready || cool) && "opacity-60",
              wrong === n && "animate-wiggle bg-rose",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Asesmen masuk SD ---------- */
type Q = QuizQ;

export function buildAssessment(p: Profile): Q[] {
  const decoyNames = ["Budi", "Siti", "Andi", "Rina", "Joko", "Maya"];
  const decoyEmojis = ["⚽", "🎈", "🍎", "🧸", "🚗"];
  const nameOpts = (real: string) => [real, ...shuffle(decoyNames.filter((n) => n !== real)).slice(0, 2)];
  const personal: Q[] = [];
  const add = (id: string, prompt: string, name: string) =>
    personal.push({ id, cat: "keluarga", prompt, options: nameOpts(name), answer: name });
  if (p.childName) add("p-anak", "Mana namamu? Ketuk namamu ya.", p.childName);
  if (p.motherName) add("p-ibu", "Siapa nama ibumu?", p.motherName);
  if (p.fatherName) add("p-ayah", "Siapa nama ayahmu?", p.fatherName);
  p.family.forEach((f, k) => add(`p-kel-${k}-${f.relation}`, `Siapa nama ${f.relation}mu?`, f.name));
  // Benda khusus dari Portal Orang Tua: mainan kesayangan, hewan peliharaan, dll.
  (p.specials ?? []).forEach((s, k) =>
    personal.push({
      id: `p-spec-${k}-${s.name}`,
      cat: "keluarga",
      prompt: `Mana ${s.name} ${s.emoji}? Ketuk gambarnya ya.`,
      options: [s.emoji, ...shuffle(decoyEmojis.filter((e) => e !== s.emoji)).slice(0, 2)],
      answer: s.emoji,
    }),
  );
  // Soal dipilih dari bank besar: yang belum pernah keluar didahulukan, kategori berbeda-beda.
  return pickQuestions([...QUIZ_BANK, ...personal], 3).map((x) => ({ ...x, options: shuffle(x.options) }));
}

export function AssessmentStep({ profile, onDone }: { profile: Profile; onDone: (perfect?: boolean) => void }) {
  // Dibuat sekali saat langkah dimulai. Jangan dibuat ulang saat bintang bertambah
  // (itu yang membuat soal lain terbaca padahal layar sudah selesai).
  const [qs] = useState(() => buildAssessment(profile));
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [perfect, setPerfect] = useState(true);
  const { cool, wrong: markWrong } = useWrongPause();
  const ready = useGateReady();
  const q = qs[i];
  if (!q) return null;
  return (
    <div className="space-y-5">
      <Instruction key={i} text={q.prompt} />
      {q.visual && <div className="text-center text-6xl tracking-widest">{q.visual}</div>}
      <div className="flex flex-wrap justify-center gap-4">
        {q.options.map((o) => (
          <button
            key={o}
            disabled={!ready || cool}
            onClick={() => {
              if (o === q.answer) {
                markSeen(q.id);
                praiseThen(() => (i + 1 < qs.length ? setI(i + 1) : onDone(perfect)));
              } else {
                markWrong(() => setPerfect(false));
                setWrong(o);
                setTimeout(() => setWrong(null), 900);
              }
            }}
            className={cn(
              bigBtn,
              "min-h-28 min-w-28 bg-lilac px-5 font-display text-4xl leading-tight break-words whitespace-pre-line sm:min-h-32 sm:min-w-32 sm:text-5xl",
              /[a-z]/i.test(o) && "text-2xl sm:text-3xl",
              (!ready || cool) && "opacity-60",
              wrong === o && "animate-wiggle bg-rose",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
