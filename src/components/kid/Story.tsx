import { useEffect, useRef, useState } from "react";
import { speak, stopSpeaking } from "@/lib/speech";
import type { Activity, StoryPage } from "@/data/stories";
import { Instruction, praiseThen, tryAgain } from "./Speaker";
import { cn } from "@/lib/utils";

export function KaraokeText({ text, active }: { text: string; active: number }) {
  return (
    <p className="font-display text-2xl leading-relaxed text-foreground md:text-3xl">
      {text.split(/\s+/).map((w, i) => (
        <span
          key={i}
          className={cn(
            "mr-2 inline-block rounded-lg px-1 transition-colors",
            i === active && "bg-butter text-foreground scale-110",
          )}
        >
          {w}
        </span>
      ))}
    </p>
  );
}

function TapActivity({ a, onDone }: { a: Extract<Activity, { type: "tap" | "choose" }>; onDone: () => void }) {
  const [wrong, setWrong] = useState<string | null>(null);
  const [right, setRight] = useState(false);
  return (
    <div className="space-y-4">
      <Instruction text={a.prompt} />
      <div className="flex flex-wrap justify-center gap-4">
        {a.options.map((o) => (
          <button
            key={o}
            onClick={() => {
              if (right) return;
              if (o === a.answer) {
                setRight(true);
                praiseThen(onDone);
              } else {
                setWrong(o);
                tryAgain();
                setTimeout(() => setWrong(null), 900);
              }
            }}
            className={cn(
              "min-h-28 min-w-28 rounded-3xl bg-sky px-6 font-display text-5xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none",
              o.length > 3 && "text-2xl",
              wrong === o && "animate-wiggle bg-rose",
              right && o === a.answer && "animate-pop bg-mint",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function DragActivity({ a, onDone }: { a: Extract<Activity, { type: "drag" }>; onDone: () => void }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [done, setDone] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const target = useRef<HTMLDivElement>(null);
  const item = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-4">
      <Instruction text={a.prompt} />
      <div className="relative flex h-56 items-center justify-between rounded-3xl bg-mint/50 px-6">
        <div
          ref={item}
          className={cn("z-10 cursor-grab touch-none text-7xl", done && "opacity-0")}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture(e.pointerId);
            start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
          }}
          onPointerMove={(e) => {
            if (start.current) setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
          }}
          onPointerUp={() => {
            start.current = null;
            const t = target.current!.getBoundingClientRect();
            const i = item.current!.getBoundingClientRect();
            const cx = i.left + i.width / 2;
            const cy = i.top + i.height / 2;
            if (cx > t.left - 20 && cx < t.right + 20 && cy > t.top - 20 && cy < t.bottom + 20) {
              setDone(true);
              praiseThen(onDone);
            } else {
              setPos({ x: 0, y: 0 });
              if (Math.abs(pos.x) > 30) tryAgain();
            }
          }}
        >
          {a.item}
        </div>
        <div className="flex flex-col items-center gap-6">
          {a.distractor && <div className="text-6xl opacity-80">{a.distractor}</div>}
        </div>
        <div
          ref={target}
          className={cn(
            "flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed border-primary text-7xl",
            done && "animate-pop border-success bg-card",
          )}
        >
          {a.target}
          {done && <span className="absolute text-4xl">{a.item}</span>}
        </div>
      </div>
    </div>
  );
}

export function ActivityView({ a, onDone }: { a: Activity; onDone: () => void }) {
  return a.type === "drag" ? <DragActivity a={a} onDone={onDone} /> : <TapActivity a={a} onDone={onDone} />;
}

export function StoryReader({
  title,
  pages,
  onDone,
}: {
  title: string;
  pages: StoryPage[];
  onDone: () => void;
}) {
  const [page, setPage] = useState(0);
  const [word, setWord] = useState(-1);
  const [narrated, setNarrated] = useState(false);
  const [actDone, setActDone] = useState(false);
  const p = pages[page];

  const narrate = () => {
    setWord(-1);
    speak(p.text, { onWord: setWord, onEnd: () => setNarrated(true) });
  };

  useEffect(() => {
    setNarrated(false);
    setActDone(!p.activity);
    const t = setTimeout(() => {
      if (page === 0) speak(title, { onEnd: narrate });
      else narrate();
    }, 300);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-foreground">📖 {title}</h2>
        <span className="rounded-full bg-muted px-4 py-1 font-display text-lg">
          {page + 1} / {pages.length}
        </span>
      </div>
      <div className="rounded-[2rem] bg-gradient-to-b from-sky to-mint p-6 text-center">
        <div className="animate-float text-8xl tracking-widest md:text-9xl">{p.scene}</div>
      </div>
      <div className="flex items-start gap-4 rounded-3xl bg-card p-5">
        <button
          aria-label="Bacakan lagi"
          onClick={narrate}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-butter text-4xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none"
        >
          🔊
        </button>
        <KaraokeText text={p.text} active={word} />
      </div>
      {narrated && p.activity && !actDone && (
        <ActivityView key={page} a={p.activity} onDone={() => setActDone(true)} />
      )}
      {(actDone || (!p.activity && narrated)) && (
        <button
          onClick={() => (page + 1 < pages.length ? setPage(page + 1) : onDone())}
          className="animate-pop h-20 w-full rounded-full bg-success font-display text-3xl text-primary-foreground shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none"
        >
          {page + 1 < pages.length ? "Halaman berikutnya ▶" : "Selesai! ⭐"}
        </button>
      )}
    </div>
  );
}
