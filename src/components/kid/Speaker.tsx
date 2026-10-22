import { useEffect } from "react";
import { Volume2 } from "lucide-react";
import { speak, speakAsync, stopSpeaking } from "@/lib/speech";
import { vibrateNo, vibrateOk } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export function SpeakerButton({
  text,
  lang = "id-ID",
  size = "lg",
  className,
}: {
  text: string;
  lang?: "id-ID" | "en-US";
  size?: "md" | "lg";
  className?: string;
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

/** Instruction bar: big speaker + prompt, auto-played. */
export function Instruction({ text }: { text: string }) {
  useAutoSpeak(text);
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-card p-3 shadow-sm">
      <SpeakerButton text={text} />
      <p className="font-display text-xl text-foreground md:text-2xl">{text}</p>
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
