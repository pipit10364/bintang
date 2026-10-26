import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { speak, stopSpeaking } from "@/lib/speech";
import { listenOnce, matchesTarget, recognitionSupported, stopListening } from "@/lib/recognition";
import { Instruction, praiseThen, tryAgain, useGateReady, WRONG_PAUSE_MS } from "./Speaker";
import { cn } from "@/lib/utils";

const bigBtn =
  "rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none transition";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

/** Hanya huruf a sampai z yang dihitung (spasi dan tanda hubung diabaikan). */
export const lettersOnly = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/* ---------- Papan huruf untuk anak ---------- */
export function LetterKeyboard({
  onKey,
  onBack,
  disabled,
}: {
  onKey: (k: string) => void;
  onBack: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto grid max-w-md grid-cols-7 gap-1.5 sm:gap-2">
      {ALPHABET.map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onKey(k)}
          className={cn(
            bigBtn,
            "flex h-11 items-center justify-center bg-card font-display text-2xl uppercase shadow-[0_4px_0_var(--border)] sm:h-14 sm:text-3xl",
            disabled && "opacity-50",
          )}
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={onBack}
        aria-label="Hapus huruf terakhir"
        className={cn(
          bigBtn,
          "col-span-2 flex h-11 items-center justify-center bg-rose font-display text-2xl shadow-[0_4px_0_var(--border)] sm:h-14",
          disabled && "opacity-50",
        )}
      >
        ⌫
      </button>
    </div>
  );
}

/**
 * Ketik jawaban (seperti Duolingo): anak mendengar dan melihat petunjuk, lalu mengetik katanya.
 * Salah dua kali: huruf pertama dibantu. Selesai dilaporkan lewat onDone(sempurna?).
 */
export function TypeAnswer({
  target,
  clue,
  speakText,
  lang = "id-ID",
  onDone,
  onWrong,
}: {
  target: string;
  clue?: ReactNode;
  speakText: string;
  lang?: "id-ID" | "en-US";
  onDone: (perfect: boolean) => void;
  onWrong?: () => void;
}) {
  const goal = useMemo(() => lettersOnly(target), [target]);
  const [typed, setTyped] = useState("");
  const [wrongCount, setWrongCount] = useState(0);
  const [cool, setCool] = useState(false);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const ready = useGateReady();
  const locked = Math.min(Math.max(wrongCount - 1, 0), Math.max(goal.length - 1, 0));
  const spokenRef = useRef(false);

  // Ucapkan katanya sekali setelah instruksi selesai.
  useEffect(() => {
    if (ready && !spokenRef.current) {
      spokenRef.current = true;
      speak(speakText, { lang });
    }
  }, [ready, speakText, lang]);

  const check = useCallback(
    (value: string) => {
      if (value === goal) {
        setDone(true);
        praiseThen(() => onDone(wrongCount === 0));
        return;
      }
      onWrong?.();
      const nextWrong = wrongCount + 1;
      // Salah dua kali atau lebih: huruf di depan dibantu dan dikunci.
      const nextLocked = Math.min(Math.max(nextWrong - 1, 0), Math.max(goal.length - 1, 0));
      setWrongCount(nextWrong);
      setShake(true);
      setCool(true);
      tryAgain();
      setTimeout(() => {
        setShake(false);
        setCool(false);
        setTyped(goal.slice(0, nextLocked));
      }, WRONG_PAUSE_MS);
    },
    [goal, onDone, onWrong, wrongCount],
  );

  const press = useCallback(
    (k: string) => {
      if (!ready || cool || done || typed.length >= goal.length) return;
      const next = typed + k;
      setTyped(next);
      if (next.length === goal.length) check(next);
    },
    [ready, cool, done, typed, goal, check],
  );
  const back = useCallback(() => {
    if (!ready || cool || done || typed.length <= locked) return;
    setTyped(typed.slice(0, -1));
  }, [ready, cool, done, typed, locked]);

  // Awal: huruf yang dikunci langsung terisi.
  useEffect(() => {
    setTyped((t) => (t.length < locked ? goal.slice(0, locked) : t));
  }, [locked, goal]);

  // Papan ketik fisik di komputer
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [press, back]);

  // Tampilan kotak huruf; spasi dan tanda hubung di kata asli jadi jarak antar kata.
  let idx = 0;
  const slots = target.split("").map((ch, i) => {
    if (!/[a-zA-Z]/.test(ch)) return <span key={i} className="w-3" />;
    const my = idx++;
    const filled = typed[my];
    return (
      <span
        key={i}
        className={cn(
          "flex h-12 w-9 items-center justify-center rounded-xl border-b-4 border-border bg-card font-display text-3xl uppercase sm:h-14 sm:w-11",
          my < locked && "bg-butter",
          done && "bg-mint",
          shake && "animate-wiggle bg-rose",
        )}
      >
        {filled ?? ""}
      </span>
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-butter/40 p-5 text-center">
        {clue}
        <button
          type="button"
          onClick={() => speak(speakText, { lang })}
          className={cn(bigBtn, "bg-sky px-6 py-2 font-display text-2xl")}
        >
          🔊 Dengar lagi
        </button>
        <div className="flex flex-wrap items-center justify-center gap-1.5">{slots}</div>
      </div>
      <LetterKeyboard onKey={press} onBack={back} disabled={!ready || cool || done} />
    </div>
  );
}

/**
 * Baca keras: anak mengucapkan kata, mikrofon mendengarkan. Kalau peramban tidak mendukung
 * pengenalan suara, orang tua yang menilai lewat tombol.
 */
export function ReadAloud({
  target,
  lang = "id-ID",
  clue,
  onDone,
  onWrong,
}: {
  target: string;
  lang?: "id-ID" | "en-US";
  clue: ReactNode;
  onDone: (perfect: boolean) => void;
  onWrong?: () => void;
}) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "listening" | "wrong" | "ok" | "denied" | "silent">(
    "idle",
  );
  const [heard, setHeard] = useState("");
  const [tries, setTries] = useState(0);
  const ready = useGateReady();

  useEffect(() => {
    setSupported(recognitionSupported());
    return () => stopListening();
  }, []);

  const succeed = (perfect: boolean) => {
    setStatus("ok");
    praiseThen(() => onDone(perfect));
  };

  const listen = async () => {
    if (!ready || status === "listening" || status === "ok") return;
    stopSpeaking();
    setStatus("listening");
    setHeard("");
    const r = await listenOnce(lang);
    if (r.error === "not-allowed" || r.error === "service-not-allowed") return setStatus("denied");
    if (!r.heard.length) return setStatus("silent");
    setHeard(r.heard[0]);
    if (matchesTarget(r.heard, target)) return succeed(tries === 0);
    onWrong?.();
    setTries((n) => n + 1);
    setStatus("wrong");
    tryAgain();
  };

  const msg: Record<typeof status, string> = {
    idle: "Ketuk mikrofon, lalu baca dengan suara keras.",
    listening: "Aku mendengarkan... ayo baca!",
    wrong: "Hampir! Dengarkan lagi, lalu coba baca ya.",
    ok: "Bacaanmu benar!",
    denied: "Izinkan mikrofon dulu di peramban ya, lalu ketuk lagi.",
    silent: "Suaranya belum terdengar. Coba lebih keras ya.",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-butter/40 p-5 text-center">
        {clue}
        <button
          type="button"
          onClick={() => speak(target, { lang })}
          className={cn(bigBtn, "bg-sky px-6 py-2 font-display text-2xl")}
        >
          🔊 Dengarkan contoh
        </button>
      </div>

      {supported === false ? (
        <div className="space-y-3 rounded-3xl bg-card p-4 text-center">
          <p className="font-display text-lg">
            Perangkat ini belum bisa mendengar bacaan. Anak membaca keras, lalu orang tua menilai.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled={!ready || status === "ok"}
              onClick={() => succeed(true)}
              className={cn(
                bigBtn,
                "bg-success px-6 py-3 font-display text-2xl text-primary-foreground",
              )}
            >
              👍 Sudah benar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          <button
            type="button"
            aria-label="Mulai membaca"
            disabled={!ready || supported === null}
            onClick={listen}
            className={cn(
              bigBtn,
              "mx-auto flex h-28 w-28 items-center justify-center text-6xl",
              status === "listening"
                ? "animate-pulse bg-rose"
                : status === "ok"
                  ? "bg-mint"
                  : "bg-success",
              (!ready || supported === null) && "opacity-50",
            )}
          >
            🎤
          </button>
          <p className="font-display text-lg text-foreground">{msg[status]}</p>
          {heard && status === "wrong" && (
            <p className="text-sm text-muted-foreground">Yang terdengar: "{heard}"</p>
          )}
          {tries >= 3 && status !== "ok" && (
            <button
              type="button"
              onClick={() => succeed(false)}
              className={cn(bigBtn, "bg-butter px-6 py-2 font-display text-xl")}
            >
              Lewati ▶
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Langkah siap pakai: daftar kata ---------- */
export type DrillWord = { text: string; emoji: string; lang?: "id-ID" | "en-US" };

/** Ketik beberapa kata satu per satu. */
export function TypeWordsStep({
  words,
  lang = "id-ID",
  onDone,
  onWrong,
}: {
  words: DrillWord[];
  lang?: "id-ID" | "en-US";
  onDone: (perfect: boolean) => void;
  onWrong?: (w: DrillWord) => void;
}) {
  const [i, setI] = useState(0);
  const [perfect, setPerfect] = useState(true);
  const w = words[i];
  return (
    <div className="space-y-4">
      <Instruction
        key={i}
        text="Dengarkan katanya, lalu ketik dengan huruf. Lihat gambarnya untuk petunjuk."
      />
      <TypeAnswer
        key={w.text}
        target={w.text}
        speakText={w.text}
        lang={w.lang ?? lang}
        clue={<div className="text-7xl">{w.emoji}</div>}
        onWrong={() => {
          setPerfect(false);
          onWrong?.(w);
        }}
        onDone={(p) => {
          if (!p) setPerfect(false);
          if (i + 1 < words.length) setI(i + 1);
          else onDone(perfect && p);
        }}
      />
      <p className="text-center font-display text-lg text-muted-foreground">
        {i + 1} / {words.length}
      </p>
    </div>
  );
}

/** Baca keras beberapa kata satu per satu. */
export function ReadWordsStep({
  words,
  lang = "id-ID",
  onDone,
  onWrong,
}: {
  words: DrillWord[];
  lang?: "id-ID" | "en-US";
  onDone: (perfect: boolean) => void;
  onWrong?: (w: DrillWord) => void;
}) {
  const [i, setI] = useState(0);
  const [perfect, setPerfect] = useState(true);
  const w = words[i];
  return (
    <div className="space-y-4">
      <Instruction
        key={i}
        text="Ayo membaca! Lihat katanya, ketuk mikrofon, lalu baca dengan suara keras."
      />
      <ReadAloud
        key={w.text}
        target={w.text}
        lang={w.lang ?? lang}
        clue={
          <>
            <div className="text-7xl">{w.emoji}</div>
            <div className="font-display text-5xl text-foreground">{w.text}</div>
          </>
        }
        onWrong={() => {
          setPerfect(false);
          onWrong?.(w);
        }}
        onDone={(p) => {
          if (!p) setPerfect(false);
          if (i + 1 < words.length) setI(i + 1);
          else onDone(perfect && p);
        }}
      />
      <p className="text-center font-display text-lg text-muted-foreground">
        {i + 1} / {words.length}
      </p>
    </div>
  );
}
