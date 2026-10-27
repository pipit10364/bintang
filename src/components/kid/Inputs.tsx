import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { speak, stopSpeaking } from "@/lib/speech";
import {
  isTechnicalError,
  kidMessage,
  listenOnce,
  matchesTarget,
  recognitionSupported,
  stopListening,
} from "@/lib/recognition";
import { vibrateNo, vibrateTick } from "@/lib/haptics";
import { Instruction, praiseThen, tryAgain, useGateReady } from "./Speaker";
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
  hint,
}: {
  onKey: (k: string) => void;
  /** Tombol hapus hanya muncul kalau diberikan. */
  onBack?: () => void;
  disabled?: boolean;
  /** Huruf yang disorot (bantuan setelah anak salah beberapa kali). */
  hint?: string;
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
            "flex h-12 items-center justify-center bg-card font-display text-2xl uppercase shadow-[0_4px_0_var(--border)] sm:h-14 sm:text-3xl",
            disabled && "opacity-50",
            hint === k && "animate-pulse bg-butter ring-4 ring-primary",
          )}
        >
          {k}
        </button>
      ))}
      {onBack && (
        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          aria-label="Hapus huruf terakhir"
          className={cn(
            bigBtn,
            "col-span-2 flex h-12 items-center justify-center bg-rose font-display text-2xl shadow-[0_4px_0_var(--border)] sm:h-14",
            disabled && "opacity-50",
          )}
        >
          ⌫
        </button>
      )}
    </div>
  );
}

/**
 * Seberapa banyak bantuan menulis. Anak kelas 1 belum bisa mengeja dari ingatan, jadi
 * bantuannya memudar bertahap: salin kata (huruf samar terlihat), huruf pertama diberikan,
 * lalu menulis dari ingatan.
 */
export type Assist = "copy" | "first" | "none";

/** Bantuan untuk kata ke-i dari n kata: sepertiga pertama menyalin, sepertiga kedua dibantu huruf pertama. */
export function assistFor(i: number, n: number): Assist {
  if (n <= 1) return "copy";
  if (i < Math.ceil(n / 3)) return "copy";
  if (i < Math.ceil((2 * n) / 3)) return "first";
  return "none";
}

/**
 * Ketik jawaban (seperti Duolingo): anak mendengar dan melihat petunjuk, lalu mengetik katanya.
 * Huruf yang salah langsung ditolak (kotak bergoyang), jadi anak tahu persis huruf mana yang
 * keliru. Salah dua kali di huruf yang sama: tombol huruf yang benar menyala.
 * Selesai dilaporkan lewat onDone(sempurna?).
 */
export function TypeAnswer({
  target,
  clue,
  speakText,
  lang = "id-ID",
  assist = "none",
  onDone,
  onWrong,
}: {
  target: string;
  clue?: ReactNode;
  speakText: string;
  lang?: "id-ID" | "en-US";
  assist?: Assist;
  onDone: (perfect: boolean) => void;
  onWrong?: () => void;
}) {
  const goal = useMemo(() => lettersOnly(target), [target]);
  const given = assist === "first" ? Math.min(1, Math.max(goal.length - 1, 0)) : 0;
  const [typed, setTyped] = useState(() => goal.slice(0, given));
  const [wrongCount, setWrongCount] = useState(0);
  const [posWrong, setPosWrong] = useState(0);
  const [cool, setCool] = useState(false);
  const [shakeAt, setShakeAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const ready = useGateReady();
  const spokenRef = useRef(false);
  const scoldedRef = useRef(false);

  // Ucapkan katanya sekali setelah instruksi selesai.
  useEffect(() => {
    if (ready && !spokenRef.current) {
      spokenRef.current = true;
      speak(speakText, { lang });
    }
  }, [ready, speakText, lang]);

  const press = useCallback(
    (k: string) => {
      if (!ready || cool || done || typed.length >= goal.length) return;
      const at = typed.length;
      if (k === goal[at]) {
        const next = typed + k;
        setTyped(next);
        setPosWrong(0);
        vibrateTick();
        if (next.length === goal.length) {
          setDone(true);
          praiseThen(() => onDone(wrongCount === 0));
        }
        return;
      }
      // Huruf salah: ditolak di tempat, huruf lain yang sudah benar tetap aman.
      onWrong?.();
      setWrongCount((n) => n + 1);
      setPosWrong((n) => n + 1);
      setShakeAt(at);
      setCool(true);
      vibrateNo();
      if (!scoldedRef.current) {
        scoldedRef.current = true;
        tryAgain();
      }
      setTimeout(() => {
        setShakeAt(null);
        setCool(false);
      }, 450);
    },
    [ready, cool, done, typed, goal, wrongCount, onDone, onWrong],
  );

  // Papan ketik fisik di komputer
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [press]);

  const hint = !done && posWrong >= 2 ? goal[typed.length] : undefined;

  // Tampilan kotak huruf; spasi dan tanda hubung di kata asli jadi jarak antar kata.
  let idx = 0;
  const slots = target.split("").map((ch, i) => {
    if (!/[a-zA-Z]/.test(ch)) return <span key={i} className="w-3" />;
    const my = idx++;
    const filled = typed[my];
    const isNext = my === typed.length && !done;
    return (
      <span
        key={i}
        className={cn(
          "flex h-12 w-9 items-center justify-center rounded-xl border-b-4 border-border bg-card font-display text-3xl uppercase sm:h-14 sm:w-11",
          my < given && "bg-butter",
          isNext && "ring-4 ring-primary/60",
          done && "bg-mint",
          shakeAt === my && "animate-wiggle bg-rose",
        )}
      >
        {filled ?? (assist === "copy" ? <span className="opacity-30">{goal[my]}</span> : "")}
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
      <LetterKeyboard onKey={press} disabled={!ready || done} hint={hint} />
    </div>
  );
}

/**
 * Baca keras: anak mengucapkan kata, mikrofon mendengarkan. Kalau peramban tidak mendukung
 * pengenalan suara, atau mikrofon bermasalah berulang kali, orang tua yang menilai lewat tombol.
 * Tombol mikrofon selalu bisa diketuk (instruksi yang sedang dibacakan langsung dihentikan),
 * dan layar menunjukkan tahap yang sedang berjalan supaya jelas kalau ada yang macet.
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
  const [online, setOnline] = useState(true);
  const [phase, setPhase] = useState<
    "idle" | "opening" | "mic" | "speech" | "wrong" | "ok" | "problem"
  >("idle");
  const [note, setNote] = useState("");
  const [live, setLive] = useState("");
  const [tries, setTries] = useState(0); // salah baca
  const [trouble, setTrouble] = useState(0); // gagal teknis / tidak terdengar, berturut-turut
  const busy = phase === "opening" || phase === "mic" || phase === "speech";

  useEffect(() => {
    setSupported(recognitionSupported());
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      stopListening();
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const succeed = (perfect: boolean) => {
    setPhase("ok");
    praiseThen(() => onDone(perfect));
  };

  const listen = async () => {
    if (phase === "ok") return;
    if (busy) {
      stopListening(); // ketuk lagi = batal
      return;
    }
    stopSpeaking();
    setPhase("opening");
    setLive("");
    setNote("");
    const r = await listenOnce(lang, {
      onPhase: (p) => setPhase((cur) => (cur === "ok" ? cur : p)),
      onInterim: setLive,
      isMatch: (h) => matchesTarget(h, target),
    });
    if (r.matched || matchesTarget(r.heard, target)) {
      setTrouble(0);
      return succeed(tries === 0);
    }
    if (r.error === "aborted" && !r.heard.length) return setPhase("idle");
    if (r.error && isTechnicalError(r.error)) {
      setTrouble((n) => n + 1);
      setNote(kidMessage[r.error]);
      return setPhase("problem");
    }
    if (!r.heard.length) {
      // Ada suara terdeteksi tetapi tidak ada teks: layanan pengenalan yang bermasalah.
      const err = r.speechDetected ? "error" : "no-speech";
      setTrouble((n) => n + 1);
      setNote(kidMessage[err]);
      return setPhase("problem");
    }
    setTrouble(0);
    setLive(r.heard[0]);
    onWrong?.();
    setTries((n) => n + 1);
    setPhase("wrong");
    tryAgain();
  };

  const msg: Record<typeof phase, string> = {
    idle: "Ketuk mikrofon, lalu baca dengan suara keras.",
    opening: "Menyalakan mikrofon...",
    mic: "Aku mendengarkan... ayo baca!",
    speech: "Aku mendengar suaramu...",
    wrong: "Hampir! Dengarkan lagi, lalu coba baca ya.",
    ok: "Bacaanmu benar!",
    problem: note,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-butter/40 p-5 text-center">
        {clue}
        <button
          type="button"
          onClick={() => {
            stopListening();
            speak(target, { lang });
          }}
          className={cn(bigBtn, "bg-sky px-6 py-2 font-display text-2xl")}
        >
          🔊 Dengarkan contoh
        </button>
      </div>

      {supported === false || (supported && !online) ? (
        <div className="space-y-3 rounded-3xl bg-card p-4 text-center">
          <p className="font-display text-lg">
            {supported === false
              ? "Perangkat ini belum bisa mendengar bacaan. Anak membaca keras, lalu orang tua menilai."
              : "Tidak ada internet, jadi mikrofon belum bisa mendengar. Anak membaca keras, lalu orang tua menilai."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled={phase === "ok"}
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
            aria-label={busy ? "Berhenti mendengarkan" : "Mulai membaca"}
            disabled={supported === null}
            onClick={listen}
            className={cn(
              bigBtn,
              "mx-auto flex h-28 w-28 items-center justify-center text-6xl",
              phase === "speech"
                ? "animate-pulse bg-mint ring-8 ring-success/50"
                : busy
                  ? "animate-pulse bg-rose"
                  : phase === "ok"
                    ? "bg-mint"
                    : "bg-success",
              supported === null && "opacity-50",
            )}
          >
            🎤
          </button>
          <p aria-live="polite" className="font-display text-lg text-foreground">
            {msg[phase]}
          </p>
          {live && (phase === "wrong" || phase === "speech" || phase === "mic") && (
            <p className="text-sm text-muted-foreground">Yang terdengar: "{live}"</p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {trouble >= 2 && phase !== "ok" && !busy && (
              <button
                type="button"
                onClick={() => succeed(false)}
                className={cn(bigBtn, "bg-success px-6 py-2 font-display text-xl text-primary-foreground")}
              >
                👍 Sudah benar (orang tua menilai)
              </button>
            )}
            {tries >= 3 && phase !== "ok" && !busy && (
              <button
                type="button"
                onClick={() => succeed(false)}
                className={cn(bigBtn, "bg-butter px-6 py-2 font-display text-xl")}
              >
                Lewati ▶
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Langkah siap pakai: daftar kata ---------- */
export type DrillWord = { text: string; emoji: string; lang?: "id-ID" | "en-US" };

const TYPE_INSTRUCTION: Record<Assist, string> = {
  copy: "Lihat huruf yang samar, lalu ketuk hurufnya satu per satu. Kamu pasti bisa!",
  first: "Huruf pertama sudah ada. Dengarkan katanya, lalu ketuk huruf berikutnya.",
  none: "Dengarkan katanya, lalu ketuk hurufnya. Lihat gambarnya untuk petunjuk.",
};

/** Ketik beberapa kata satu per satu. Bantuan memudar dari menyalin sampai dari ingatan. */
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
  const assist = assistFor(i, words.length);
  return (
    <div className="space-y-4">
      <Instruction key={i} text={TYPE_INSTRUCTION[assist]} />
      <TypeAnswer
        key={w.text}
        target={w.text}
        assist={assist}
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
