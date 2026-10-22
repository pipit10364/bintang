import { useEffect, useRef, useState } from "react";
import { speak, speakAsync, stopSpeaking } from "@/lib/speech";
import type { Activity, StoryPage } from "@/data/stories";
import { Instruction, praiseThen, tryAgain, useGateReady, WRONG_PAUSE_MS } from "./Speaker";
import { vibrateOk } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export function KaraokeText({ text, active }: { text: string; active: number }) {
  return (
    <p className="min-w-0 font-display text-xl leading-relaxed text-foreground md:text-3xl">
      {text.split(/\s+/).map((w, i) => (
        <span
          key={i}
          className={cn(
            "mr-1 inline-block rounded-lg px-1 transition-colors md:mr-2",
            i === active && "scale-110 bg-butter text-foreground",
          )}
        >
          {w}
        </span>
      ))}
    </p>
  );
}

const bigBtn =
  "rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none transition";

function TapActivity({
  a,
  onDone,
  onWrong,
}: {
  a: Extract<Activity, { type: "tap" | "choose" }>;
  onDone: () => void;
  onWrong: () => void;
}) {
  const [wrong, setWrong] = useState<string | null>(null);
  const [cool, setCool] = useState(false);
  const [right, setRight] = useState(false);
  const ready = useGateReady();
  return (
    <div className="space-y-4">
      <Instruction text={a.prompt} />
      <div className="flex flex-wrap justify-center gap-4">
        {a.options.map((o) => (
          <button
            key={o}
            disabled={!ready || cool || right}
            onClick={() => {
              if (o === a.answer) {
                setRight(true);
                praiseThen(onDone);
              } else {
                onWrong();
                setWrong(o);
                setCool(true);
                tryAgain();
                setTimeout(() => {
                  setWrong(null);
                  setCool(false);
                }, WRONG_PAUSE_MS);
              }
            }}
            className={cn(
              "min-h-24 min-w-24 bg-sky px-5 font-display text-4xl break-words sm:min-h-28 sm:min-w-28 sm:text-5xl",
              bigBtn,
              o.length > 3 && "text-2xl sm:text-3xl",
              wrong === o && "animate-wiggle bg-rose",
              right && o === a.answer && "animate-pop bg-mint",
              (!ready || cool) && !right && "opacity-60",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Hitung satu per satu: tiap ketukan membunyikan angka berikutnya. */
function CountActivity({ a, onDone }: { a: Extract<Activity, { type: "count" }>; onDone: () => void }) {
  const [tapped, setTapped] = useState<number[]>([]);
  const words = ["satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh"];
  const tap = (k: number) => {
    if (tapped.includes(k)) return;
    const n = tapped.length + 1;
    setTapped([...tapped, k]);
    vibrateOk();
    speak(words[n - 1]);
    if (n >= a.items.length) setTimeout(() => praiseThen(onDone), 1200);
  };
  return (
    <div className="space-y-4">
      <Instruction text={a.prompt} />
      <div className="flex flex-wrap justify-center gap-3">
        {a.items.map((e, k) => (
          <button
            key={k}
            onClick={() => tap(k)}
            className={cn(
              bigBtn,
              "relative flex h-20 w-20 items-center justify-center bg-card text-5xl sm:h-24 sm:w-24",
              tapped.includes(k) && "bg-mint ring-4 ring-success",
            )}
          >
            {e}
            {tapped.includes(k) && (
              <span className="absolute -top-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-success font-display text-sm text-primary-foreground">
                {tapped.indexOf(k) + 1}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="text-center font-display text-xl text-muted-foreground">
        {tapped.length} / {a.items.length}
      </p>
    </div>
  );
}

function DragActivity({
  a,
  onDone,
  onWrong,
}: {
  a: Extract<Activity, { type: "drag" }>;
  onDone: () => void;
  onWrong: () => void;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [done, setDone] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const target = useRef<HTMLDivElement>(null);
  const item = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-4">
      <Instruction text={a.prompt} />
      <div className="relative flex min-h-52 items-center justify-between gap-2 rounded-3xl bg-mint/50 px-4 py-4 sm:px-6">
        <div
          ref={item}
          className={cn("z-10 cursor-grab touch-none text-6xl sm:text-7xl", done && "opacity-0")}
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
              if (Math.abs(pos.x) > 30) {
                onWrong();
                tryAgain();
              }
            }
          }}
        >
          {a.item}
        </div>
        <div className="flex min-w-0 flex-col items-center gap-6">
          {a.distractor && <div className="text-5xl opacity-80 sm:text-6xl">{a.distractor}</div>}
        </div>
        <div
          ref={target}
          className={cn(
            "flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-dashed border-primary text-6xl sm:h-32 sm:w-32 sm:text-7xl",
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

/** Pilah ke tempat yang benar: ada dua wadah, anak memilih yang tepat. */
function SortActivity({
  a,
  onDone,
  onWrong,
}: {
  a: Extract<Activity, { type: "sort" }>;
  onDone: () => void;
  onWrong: () => void;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [done, setDone] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const item = useRef<HTMLDivElement>(null);
  const good = useRef<HTMLDivElement>(null);
  const bad = useRef<HTMLDivElement>(null);

  const over = (el: HTMLDivElement | null) => {
    if (!el || !item.current) return null;
    const t = el.getBoundingClientRect();
    const i = item.current.getBoundingClientRect();
    const cx = i.left + i.width / 2;
    const cy = i.top + i.height / 2;
    return cx > t.left - 16 && cx < t.right + 16 && cy > t.top - 16 && cy < t.bottom + 16;
  };

  return (
    <div className="space-y-4">
      <Instruction text={a.prompt} />
      <div className="flex items-center justify-center gap-4 rounded-3xl bg-lilac/40 p-4">
        <div
          ref={item}
          className={cn("z-10 cursor-grab touch-none text-6xl sm:text-7xl", done && "opacity-0")}
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
            if (over(good.current)) {
              setDone(true);
              vibrateOk();
              speak(`Betul! ${a.item} masuk ${a.good.label}.`);
              praiseThen(onDone);
            } else if (over(bad.current)) {
              onWrong();
              tryAgain();
              setPos({ x: 0, y: 0 });
            } else {
              setPos({ x: 0, y: 0 });
            }
          }}
        >
          {a.item}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div
          ref={good}
          className={cn(
            "flex min-h-32 flex-col items-center justify-center gap-1 rounded-3xl border-4 border-dashed border-success/60 bg-mint/40 p-3 text-center",
            done && "animate-pop border-success bg-mint",
          )}
        >
          <div className="text-5xl sm:text-6xl">{a.good.emoji}</div>
          <div className="font-display text-base break-words sm:text-xl">{a.good.label}</div>
        </div>
        <div
          ref={bad}
          className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-3xl border-4 border-dashed border-border bg-card p-3 text-center"
        >
          <div className="text-5xl opacity-80 sm:text-6xl">{a.bad.emoji}</div>
          <div className="font-display text-base break-words text-muted-foreground sm:text-xl">{a.bad.label}</div>
        </div>
      </div>
    </div>
  );
}

export function ActivityView({
  a,
  onDone,
  onWrong,
}: {
  a: Activity;
  onDone: () => void;
  onWrong: () => void;
}) {
  if (a.type === "drag") return <DragActivity a={a} onDone={onDone} onWrong={onWrong} />;
  if (a.type === "count") return <CountActivity a={a} onDone={onDone} />;
  if (a.type === "sort") return <SortActivity a={a} onDone={onDone} onWrong={onWrong} />;
  return <TapActivity a={a} onDone={onDone} onWrong={onWrong} />;
}

export function StoryReader({
  title,
  pages,
  onDone,
}: {
  title: string;
  pages: StoryPage[];
  onDone: (perfect?: boolean) => void;
}) {
  const [page, setPage] = useState(0);
  const [word, setWord] = useState(-1);
  const [narrated, setNarrated] = useState(false);
  const [actDone, setActDone] = useState(false);
  const [perfect, setPerfect] = useState(true);
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
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate font-display text-xl text-foreground sm:text-2xl">📖 {title}</h2>
        <span className="shrink-0 rounded-full bg-muted px-4 py-1 font-display text-lg">
          {page + 1} / {pages.length}
        </span>
      </div>
      <div className="rounded-[2rem] bg-gradient-to-b from-sky to-mint p-5 text-center sm:p-6">
        <div className="animate-float text-7xl tracking-widest sm:text-8xl md:text-9xl">{p.scene}</div>
      </div>
      <div className="flex items-start gap-3 rounded-3xl bg-card p-4 sm:gap-4 sm:p-5">
        <button
          aria-label="Bacakan lagi"
          onClick={narrate}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-butter text-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none sm:h-20 sm:w-20 sm:text-4xl"
        >
          🔊
        </button>
        <KaraokeText text={p.text} active={word} />
      </div>
      {narrated && p.activity && !actDone && (
        <ActivityView
          key={page}
          a={p.activity}
          onDone={() => setActDone(true)}
          onWrong={() => setPerfect(false)}
        />
      )}
      {(actDone || (!p.activity && narrated)) && (
        <button
          onClick={() => (page + 1 < pages.length ? setPage(page + 1) : onDone(perfect))}
          className="animate-pop h-16 w-full rounded-full bg-success font-display text-2xl text-primary-foreground shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none sm:h-20 sm:text-3xl"
        >
          {page + 1 < pages.length ? "Halaman berikutnya ▶" : "Selesai! ⭐"}
        </button>
      )}
    </div>
  );
}
