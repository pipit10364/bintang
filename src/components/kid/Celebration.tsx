import { useEffect, useMemo } from "react";
import { speak } from "@/lib/speech";

const COLORS = ["var(--peach)", "var(--mint)", "var(--sky)", "var(--lilac)", "var(--butter)", "var(--rose)"];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.5 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
        size: 8 + Math.random() * 10,
        round: Math.random() > 0.5,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? "999px" : "3px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Celebration({
  stars,
  sticker,
  message,
  onClose,
}: {
  stars: number;
  sticker?: string;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    speak(message);
  }, [message]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 p-6 backdrop-blur-sm">
      <Confetti />
      <div className="animate-pop w-full max-w-md rounded-[2rem] bg-card p-8 text-center shadow-xl">
        {sticker && <div className="animate-float text-8xl">{sticker}</div>}
        <div className="mt-2 flex justify-center gap-1 text-5xl">
          {Array.from({ length: stars }, (_, i) => (
            <span key={i} className="animate-pop" style={{ animationDelay: `${0.2 + i * 0.2}s` }}>
              ⭐
            </span>
          ))}
        </div>
        <h2 className="mt-4 text-3xl text-foreground">{message}</h2>
        <button
          onClick={onClose}
          className="mt-6 h-16 w-full rounded-full bg-success font-display text-2xl text-primary-foreground shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none"
        >
          Lanjut ▶
        </button>
      </div>
    </div>
  );
}
