import { useMemo, useState } from "react";
import { speak } from "@/lib/speech";
import type { EnWord } from "@/data/english";
import { Instruction, praiseThen, tryAgain, useGateReady, WRONG_PAUSE_MS } from "./Speaker";
import { ReadWordsStep, TypeWordsStep } from "./Inputs";
import { Celebration } from "./Celebration";
import { addStars } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TYPE_FROM_PICTURE } from "@/lib/features";
import { useEffect, useRef } from "react";

const bigBtn =
  "rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none transition";
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export type Stage = "kenal" | "dengar" | "baca" | "ketik" | "ucap";
const STAGE_ICON: Record<Stage, string> = {
  kenal: "👀",
  dengar: "👂",
  baca: "📖",
  ketik: "⌨️",
  ucap: "🎤",
};
const STAGE_NAME: Record<Stage, string> = {
  kenal: "Kenalan",
  dengar: "Dengar dan pilih gambar",
  baca: "Baca dan pilih kata",
  ketik: "Ketik katanya",
  ucap: "Ucapkan katanya",
};

/** Kata untuk latihan mengetik: pilih acak, tetapi yang pendek lebih dulu (maks. 5 kata). */
const typable = (words: EnWord[], n = 5) => {
  const len = (w: EnWord) => w.en.replace(/[^a-zA-Z]/g, "").length;
  return shuffle(words)
    .map((w, i) => ({ w, i, c: len(w) + (/[\s-]/.test(w.en) ? 20 : 0) + (len(w) > 6 ? 6 : 0) }))
    .sort((a, b) => a.c - b.c || a.i - b.i)
    .slice(0, n)
    .sort((a, b) => len(a.w) - len(b.w))
    .map((x) => x.w);
};

const sayEn = (w: EnWord) => speak(w.en, { lang: "en-US" });

/**
 * Satu sesi belajar bahasa Inggris dengan tingkat kesulitan naik:
 * kenalan, dengar lalu pilih gambar, baca lalu pilih kata, ketik katanya, ucapkan katanya.
 * Kata yang salah muncul lagi di akhir babak yang sama, dan dicatat sebagai kata sulit.
 */
export function EnglishPlay({
  words,
  pool,
  stages: allStages,
  onFinish,
}: {
  words: EnWord[];
  pool: EnWord[];
  stages: Stage[];
  onFinish: (result: { perfect: boolean; missed: string[] }) => void;
}) {
  const stages = useMemo(
    () => (TYPE_FROM_PICTURE ? allStages : allStages.filter((s) => s !== "ketik")),
    [allStages],
  );
  const [i, setI] = useState(0);
  const [celebrate, setCelebrate] = useState<null | { perfect: boolean }>(null);
  const [stagePerfect, setStagePerfect] = useState(true);
  const allPerfect = useRef(true);
  const missed = useRef<Set<string>>(new Set());
  const stage = stages[i];
  // Dipilih sekali per babak: kalau diacak ulang tiap render, kata berganti di tengah mengetik.
  const typeWords = useMemo(
    () => typable(words).map((w) => ({ text: w.en, emoji: w.emoji })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, i],
  );
  const sayWords = useMemo(
    () =>
      shuffle(words)
        .slice(0, 4)
        .map((w) => ({ text: w.en, emoji: w.emoji })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, i],
  );

  const miss = (en: string) => {
    missed.current.add(en);
    allPerfect.current = false;
    setStagePerfect(false);
  };

  const finishStage = (perfect: boolean) => {
    if (!perfect) allPerfect.current = false;
    addStars(perfect && stagePerfect ? 2 : 1);
    setCelebrate({ perfect: perfect && stagePerfect });
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {stages.map((s, k) => (
          <div
            key={s}
            title={STAGE_NAME[s]}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full text-xl sm:h-12 sm:w-12 sm:text-2xl",
              k < i ? "bg-mint" : k === i ? "bg-butter ring-4 ring-primary" : "bg-muted opacity-60",
            )}
          >
            {k < i ? "⭐" : STAGE_ICON[s]}
          </div>
        ))}
      </div>
      <h2 className="mb-3 text-center text-xl text-muted-foreground">{STAGE_NAME[stage]}</h2>

      <div key={`${stage}-${i}`}>
        {stage === "kenal" && <Meet words={words} onDone={() => finishStage(true)} />}
        {stage === "dengar" && (
          <ListenPick words={words} pool={pool} onMiss={miss} onDone={() => finishStage(true)} />
        )}
        {stage === "baca" && (
          <ReadPick words={words} pool={pool} onMiss={miss} onDone={() => finishStage(true)} />
        )}
        {stage === "ketik" && (
          <TypeWordsStep
            lang="en-US"
            words={typeWords}
            onWrong={(w) => miss(w.text)}
            onDone={(p) => finishStage(p)}
          />
        )}
        {stage === "ucap" && (
          <ReadWordsStep
            lang="en-US"
            words={sayWords}
            onWrong={(w) => miss(w.text)}
            onDone={(p) => finishStage(p)}
          />
        )}
      </div>

      {celebrate && (
        <Celebration
          stars={celebrate.perfect ? 2 : 1}
          message={
            i + 1 >= stages.length
              ? "Hebat! Kamu menyelesaikan semua tantangan!"
              : celebrate.perfect
                ? "Luar biasa! Benar di percobaan pertama. Dua bintang untukmu!"
                : "Hebat! Kamu dapat bintang!"
          }
          onClose={() => {
            setCelebrate(null);
            setStagePerfect(true);
            if (i + 1 >= stages.length)
              onFinish({ perfect: allPerfect.current, missed: [...missed.current] });
            else setI(i + 1);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Kenalan ---------- */
function Meet({ words, onDone }: { words: EnWord[]; onDone: () => void }) {
  const [tapped, setTapped] = useState<string[]>([]);
  const all = words.every((w) => tapped.includes(w.en));
  return (
    <div className="space-y-5">
      <Instruction text="Ketuk setiap gambar untuk mendengar bahasa Inggrisnya." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {words.map((w) => (
          <button
            key={w.en}
            onClick={() => {
              sayEn(w);
              if (!tapped.includes(w.en)) setTapped([...tapped, w.en]);
            }}
            className={cn(
              bigBtn,
              "flex flex-col items-center gap-1 p-3",
              tapped.includes(w.en) ? "bg-mint" : "bg-card",
            )}
          >
            <span className="text-5xl">{w.emoji}</span>
            <span className="font-display text-2xl">{w.en}</span>
            <span className="text-sm text-muted-foreground">{w.id}</span>
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {tapped.length} / {words.length} kata sudah kamu ketuk
      </p>
      <button
        disabled={!all}
        onClick={onDone}
        className={cn(
          bigBtn,
          "h-20 w-full bg-success font-display text-3xl text-primary-foreground",
          !all && "opacity-40",
        )}
      >
        Ayo main! ▶
      </button>
    </div>
  );
}

/** Putaran soal: kata yang salah dimasukkan lagi ke antrean (sekali). */
function useRetryRounds(
  words: EnWord[],
  count: number,
  onMiss: (en: string) => void,
  onDone: () => void,
) {
  const [queue, setQueue] = useState<EnWord[]>(() => shuffle(words).slice(0, count));
  const [r, setR] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [cool, setCool] = useState(false);
  const requeued = useRef<Set<string>>(new Set());
  const ready = useGateReady();
  const item = queue[r];

  const answer = (key: string, correct: boolean) => {
    if (!ready || cool) return;
    if (correct) {
      praiseThen(() => (r + 1 < queue.length ? setR(r + 1) : onDone()));
      return;
    }
    onMiss(item.en);
    setWrong(key);
    setCool(true);
    tryAgain();
    if (!requeued.current.has(item.en)) {
      requeued.current.add(item.en);
      setQueue((q) => [...q, item]);
    }
    setTimeout(() => {
      setWrong(null);
      setCool(false);
    }, WRONG_PAUSE_MS);
  };
  return { item, r, total: queue.length, wrong, cool, ready, answer };
}

/** Pilihan jawaban: kata yang mirip (satu tema) diutamakan supaya lebih menantang. */
function useOptions(item: EnWord, pool: EnWord[], n: number) {
  return useMemo(() => {
    const others = pool.filter((p) => p.en !== item.en);
    return shuffle([item, ...shuffle(others).slice(0, n - 1)]);
  }, [item, pool, n]);
}

/* ---------- Dengar lalu pilih gambar ---------- */
function ListenPick({
  words,
  pool,
  onMiss,
  onDone,
}: {
  words: EnWord[];
  pool: EnWord[];
  onMiss: (en: string) => void;
  onDone: () => void;
}) {
  const { item, r, total, wrong, cool, ready, answer } = useRetryRounds(
    words,
    Math.min(6, words.length),
    onMiss,
    onDone,
  );
  const options = useOptions(item, pool, 4);
  const spoken = useRef(-1);

  useEffect(() => {
    if (ready && spoken.current !== r) {
      spoken.current = r;
      sayEn(item);
    }
  }, [ready, r, item]);

  return (
    <div className="space-y-5">
      <Instruction key={r} text="Dengarkan katanya, lalu ketuk gambar yang cocok." />
      <div className="flex justify-center">
        <button
          onClick={() => sayEn(item)}
          className={cn(bigBtn, "bg-butter px-8 py-4 font-display text-3xl")}
        >
          🔊 Dengar lagi
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {options.map((o) => (
          <button
            key={o.en}
            disabled={!ready || cool}
            onClick={() => answer(o.en, o.en === item.en)}
            className={cn(
              bigBtn,
              "flex h-28 items-center justify-center bg-card text-7xl",
              wrong === o.en && "animate-wiggle bg-rose",
              (!ready || cool) && "opacity-60",
            )}
          >
            {o.emoji}
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {Math.min(r + 1, total)} / {total}
      </p>
    </div>
  );
}

/* ---------- Baca lalu pilih kata ---------- */
function ReadPick({
  words,
  pool,
  onMiss,
  onDone,
}: {
  words: EnWord[];
  pool: EnWord[];
  onMiss: (en: string) => void;
  onDone: () => void;
}) {
  const { item, r, total, wrong, cool, ready, answer } = useRetryRounds(
    words,
    Math.min(6, words.length),
    onMiss,
    onDone,
  );
  const options = useOptions(item, pool, 4);
  return (
    <div className="space-y-5">
      <Instruction
        key={r}
        text="Lihat gambarnya. Baca kata Inggrisnya, lalu ketuk kata yang cocok."
      />
      <div className="text-center text-8xl">{item.emoji}</div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.en}
            disabled={!ready || cool}
            onClick={() => answer(o.en, o.en === item.en)}
            className={cn(
              bigBtn,
              "min-h-20 bg-card px-3 py-4 font-display text-3xl break-words",
              wrong === o.en && "animate-wiggle bg-rose",
              (!ready || cool) && "opacity-60",
            )}
          >
            {o.en}
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {Math.min(r + 1, total)} / {total}
      </p>
    </div>
  );
}
