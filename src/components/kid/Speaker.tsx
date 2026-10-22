import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { speak, speakAsync, stopSpeaking, subscribeSpeaking } from "@/lib/speech";
import { vibrateNo, vibrateOk } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export function SpeakerButton({
  text,
  lang = "id-ID",
  size = "lg",
  className,
  active,
}: {
  text: string;
  lang?: "id-ID" | "en-US";
  size?: "md" | "lg";
  className?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="Putar suara"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, { lang });
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-butter text-foreground shadow-[0_6px_0_var(--border)] transition active:translate-y-1 active:shadow-none",
        size === "lg" ? "h-20 w-20" : "h-14 w-14",
        active && "animate-pulse ring-4 ring-butter/70",
        className,
      )}
    >
      <Volume2 className={size === "lg" ? "h-10 w-10" : "h-7 w-7"} />
    </button>
  );
}

/** Speaks the instruction automatically when it changes. */
export function useAutoSpeak(text: string | undefined, lang: "id-ID" | "en-US" = "id-ID") {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => speak(text, { lang }), 250);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [text, lang]);
}

/**
 * Gerbang anti asal tebak: `true` hanya setelah instruksi selesai dibacakan.
 * Tombol pilihan jawaban boleh diketuk lagi setelah gerbang terbuka.
 */
export function useGateReady() {
  const [state, setState] = useState({ spoken: false, speaking: false });
  useEffect(() => {
    const un = subscribeSpeaking((v) =>
      setState((s) => ({ spoken: s.spoken || v, speaking: v })),
    );
    // Cadangan: kalau mesin suara tidak tersedia sama sekali, buka gerbang setelah 4 detik.
    const fb = setTimeout(
      () => setState((s) => (s.spoken ? s : { ...s, spoken: true })),
      4000,
    );
    return () => {
      un();
      clearTimeout(fb);
    };
  }, []);
  return state.spoken && !state.speaking;
}

/** Instruction bar: big speaker + prompt, auto-played. */
export function Instruction({ text, lang = "id-ID" as "id-ID" | "en-US" }: { text: string; lang?: "id-ID" | "en-US" }) {
  useAutoSpeak(text, lang);
  const ready = useGateReady();
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-card p-3 shadow-sm">
      <SpeakerButton text={text} lang={lang} active={!ready} />
      <p className="min-w-0 font-display text-lg break-words text-foreground md:text-2xl">{text}</p>
    </div>
  );
}

export const PRAISE = ["Hebat!", "Pintar sekali!", "Benar!", "Keren!", "Bagus sekali!"];
export const praise = () => {
  vibrateOk();
  return speakAsync(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Bacakan pujian sampai selesai (maks 3 detik), baru lanjut ke langkah berikutnya. */
export const praiseThen = (next: () => void) => {
  Promise.all([Promise.race([praise(), wait(3000)]), wait(700)]).then(() => setTimeout(next, 250));
};
export const tryAgain = () => {
  vibrateNo();
  speak("Hmm, coba lagi ya!");
};

/** Jeda lembut setelah jawaban salah: tombol terkunci sebentar, tanpa tekanan. */
export const WRONG_PAUSE_MS = 1400;
