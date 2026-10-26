import { useEffect, useMemo, useRef, useState } from "react";
import { speak, speakAsync, speakSyllable, stopSpeaking } from "@/lib/speech";
import { syllabify, syllableFamily } from "@/data/syllables";
import type { Word } from "@/data/letters";
import { Instruction, praiseThen, tryAgain, useGateReady, WRONG_PAUSE_MS } from "./Speaker";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const bigBtn =
  "rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none transition";
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/**
 * Langkah mengeja suku kata:
 * 1) kenal kartu suku kata (ba be bi bo bu),
 * 2) ketuk suku kata yang dibacakan,
 * 3) eja kata nyata per suku kata, lalu baca utuh.
 */
export function SpellingStep({
  letter,
  words,
  onDone,
}: {
  letter: string;
  words: Word[];
  onDone: (perfect?: boolean) => void;
}) {
  const family = useMemo(() => syllableFamily(letter), [letter]);
  const phases = ["kenal", "ketuk", "kata"] as const;
  const [phase, setPhase] = useState<(typeof phases)[number]>("kenal");
  const [perfect, setPerfect] = useState(true);

  if (phase === "kenal")
    return (
      <MeetSyllables
        family={family}
        letter={letter}
        onDone={() => setPhase("ketuk")}
      />
    );
  if (phase === "ketuk")
    return (
      <TapSyllable
        key={letter}
        family={family}
        onWrong={() => setPerfect(false)}
        onDone={() => setPhase("kata")}
      />
    );
  return (
    <SpellWords
      key={letter}
      words={words}
      onDone={() => onDone(perfect)}
    />
  );
}

/* ---------- 1. Kenal kartu suku kata ---------- */
function MeetSyllables({
  family,
  letter,
  onDone,
}: {
  family: string[];
  letter: string;
  onDone: () => void;
}) {
  const [tapped, setTapped] = useState<string[]>([]);
  const allTapped = family.every((s) => tapped.includes(s));
  return (
    <div className="space-y-5">
      <Instruction text={`Sekarang ayo eja suku kata! Ketuk setiap kartu untuk mendengar bunyinya.`} />
      <div className="flex flex-wrap justify-center gap-3">
        {family.map((s) => (
          <button
            key={s}
            onClick={() => {
              speak(s);
              if (!tapped.includes(s)) setTapped([...tapped, s]);
            }}
            className={cn(
              bigBtn,
              "flex h-24 w-24 items-center justify-center font-display text-5xl",
              tapped.includes(s) ? "bg-mint" : "bg-sky",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {tapped.length} / {family.length} kartu sudah kamu ketuk
      </p>
      <div className="flex justify-center">
        <button
          disabled={!allTapped}
          onClick={onDone}
          className={cn(
            bigBtn,
            "h-20 w-full max-w-sm bg-success font-display text-3xl text-primary-foreground",
            !allTapped && "opacity-40",
          )}
        >
          Ayo main! ▶
        </button>
      </div>
    </div>
  );
}

/* ---------- 2. Ketuk suku kata yang dibacakan ---------- */
function TapSyllable({
  family,
  onWrong,
  onDone,
}: {
  family: string[];
  onWrong: () => void;
  onDone: () => void;
}) {
  const rounds = useMemo(() => {
    const picks = shuffle(family).slice(0, Math.min(4, family.length));
    return picks.length < 3 ? [...picks, ...shuffle(family).slice(0, 3 - picks.length)] : picks;
  }, [family]);
  const [r, setR] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [cool, setCool] = useState(false);
  const ready = useGateReady();
  const target = rounds[r];

  const pick = (s: string) => {
    if (!ready || cool) return;
    if (s === target) {
      praiseThen(() => (r + 1 < rounds.length ? setR(r + 1) : onDone()));
    } else {
      onWrong();
      setWrong(s);
      setCool(true);
      tryAgain();
      setTimeout(() => {
        setWrong(null);
        setCool(false);
      }, WRONG_PAUSE_MS);
    }
  };

  return (
    <div className="space-y-5">
      <TapPrompt key={r} target={target} />
      <div className="flex flex-wrap justify-center gap-3">
        {shuffle(family).map((s) => (
          <button
            key={s}
            disabled={!ready || cool}
            onClick={() => pick(s)}
            className={cn(
              bigBtn,
              "flex h-24 w-24 items-center justify-center font-display text-5xl",
              wrong === s ? "bg-rose" : "bg-card",
              (!ready || cool) && "opacity-60",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {r + 1} / {rounds.length}
      </p>
    </div>
  );
}

/* ---------- 3. Eja kata per suku kata, lalu baca utuh ---------- */
function SpellWords({
  words,
  onDone,
}: {
  words: Word[];
  onDone: () => void;
}) {
  const picks = useMemo(() => words.slice(0, 4), [words]);
  const [i, setI] = useState(0);
  const [highlight, setHighlight] = useState<number | "whole" | null>(null);
  const [played, setPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const w = picks[i];
  const syls = useMemo(() => syllabify(w.id), [w]);

  const spell = async () => {
    if (playing) return;
    setPlaying(true);
    setHighlight(null);
    for (let k = 0; k < syls.length; k++) {
      setHighlight(k);
      await speakAsync(syls[k]);
      await new Promise<void>((r) => setTimeout(r, 150));
    }
    setHighlight("whole");
    await speakAsync(`${w.id}!`);
    setHighlight(null);
    setPlayed(true);
    setPlaying(false);
  };

  return (
    <div className="space-y-5">
      <Instruction
        key={i}
        text={`Ayo eja kata ${w.id}. Dengarkan suku katanya satu per satu, lalu baca utuh!`}
      />
      <div className="rounded-[2rem] bg-butter/40 p-5 text-center">
        <div className="text-6xl">{w.emoji}</div>
        <div className="mt-2 font-display text-3xl text-foreground md:text-4xl">{w.id}</div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {syls.map((s, k) => (
            <button
              key={k}
              disabled={playing}
              onClick={() => speak(s)}
              className={cn(
                bigBtn,
                "min-h-16 min-w-20 bg-sky px-4 font-display text-4xl",
                highlight === k && "animate-pop bg-mint",
                highlight === "whole" && "opacity-40",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => speak(w.id)}
          className={cn(
            bigBtn,
            "mx-auto mt-3 block bg-card px-6 py-2 font-display text-2xl",
            highlight === "whole" && "animate-pop bg-mint",
          )}
        >
          {w.id} 🗣
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={spell}
          disabled={playing}
          className={cn(bigBtn, "bg-butter px-6 py-3 font-display text-2xl", playing && "opacity-50")}
        >
          🔁 Eja lagi
        </button>
        <button
          disabled={!played || playing}
          onClick={() => (i + 1 < picks.length ? setI(i + 1) : praiseThen(onDone))}
          className={cn(
            bigBtn,
            "bg-success px-6 py-3 font-display text-2xl text-primary-foreground",
            (!played || playing) && "opacity-40",
          )}
        >
          {i + 1 < picks.length ? "Kata berikutnya ▶" : "Selesai! ⭐"}
        </button>
      </div>
    </div>
  );
}

/**
 * Perintah ketuk suku kata. Urutannya: "Dengarkan baik baik ya. Ketuk suku kata." lalu
 * suku katanya diucapkan tiga kali di akhir, supaya anak mendengarnya paling jelas.
 * Tombol speaker hanya mengulang suku katanya.
 */
function TapPrompt({ target }: { target: string }) {
  const ready = useGateReady();
  const gen = useRef(0);

  useEffect(() => {
    const id = ++gen.current;
    const t = setTimeout(() => {
      speak("Dengarkan baik baik ya. Ketuk suku kata.", {
        onEnd: () => {
          if (id === gen.current) speakSyllable(target, 3);
        },
      });
    }, 250);
    return () => {
      clearTimeout(t);
      gen.current++;
      stopSpeaking();
    };
  }, [target]);

  return (
    <div className="flex items-center gap-4 rounded-3xl bg-card p-3 shadow-sm">
      <button
        type="button"
        aria-label="Ulangi suku katanya"
        onClick={() => {
          gen.current++;
          speakSyllable(target, 3);
        }}
        className={cn(
          "inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-butter text-foreground shadow-[0_6px_0_var(--border)] transition active:translate-y-1 active:shadow-none",
          !ready && "animate-pulse ring-4 ring-butter/70",
        )}
      >
        <Volume2 className="h-10 w-10" />
      </button>
      <p className="min-w-0 font-display text-lg break-words text-foreground md:text-2xl">
        Dengarkan baik baik ya. Ketuk suku kata <b>{target}</b>.
      </p>
    </div>
  );
}
