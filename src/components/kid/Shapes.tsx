import { useMemo, useState } from "react";
import { speak } from "@/lib/speech";
import { SHAPES, SHAPE_OBJECTS, TYPEABLE, getShape, type ShapeId } from "@/data/shapes";
import { Instruction, praiseThen, tryAgain, useGateReady, WRONG_PAUSE_MS } from "./Speaker";
import { TypeAnswer } from "./Inputs";
import { cn } from "@/lib/utils";

const bigBtn =
  "rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none transition";
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

const FILL: Record<ShapeId, string> = {
  lingkaran: "#8ec9ee",
  persegi: "#f3d36b",
  persegipanjang: "#8fd9b0",
  segitiga: "#f4a98a",
  bintang: "#b9a2e6",
  hati: "#f29bb0",
  oval: "#8ec9ee",
  belahketupat: "#f3d36b",
};

/** Gambar bentuk dengan SVG, jadi tetap tajam di layar apa pun. */
export function ShapeSvg({ id, size = 96 }: { id: ShapeId; size?: number }) {
  const common = {
    fill: FILL[id],
    stroke: "#4a3a32",
    strokeWidth: 4,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={getShape(id).name}>
      {id === "lingkaran" && <circle cx="50" cy="50" r="38" {...common} />}
      {id === "persegi" && <rect x="14" y="14" width="72" height="72" rx="3" {...common} />}
      {id === "persegipanjang" && <rect x="6" y="26" width="88" height="48" rx="3" {...common} />}
      {id === "segitiga" && <polygon points="50,12 92,86 8,86" {...common} />}
      {id === "bintang" && (
        <polygon points="50,8 61,38 93,38 67,57 77,89 50,70 23,89 33,57 7,38 39,38" {...common} />
      )}
      {id === "hati" && (
        <path
          d="M50 88 C10 56 10 22 32 20 C42 19 48 26 50 32 C52 26 58 19 68 20 C90 22 90 56 50 88 Z"
          {...common}
        />
      )}
      {id === "oval" && <ellipse cx="50" cy="50" rx="26" ry="40" {...common} />}
      {id === "belahketupat" && <polygon points="50,8 88,50 50,92 12,50" {...common} />}
    </svg>
  );
}

/** Langkah: kenal, cari bentuk, bentuk benda sehari hari, lalu ketik namanya. */
export function ShapesModule({ onDone }: { onDone: (perfect: boolean) => void }) {
  const steps = ["kenal", "cari", "benda", "ketik"] as const;
  const [step, setStep] = useState(0);
  const [perfect, setPerfect] = useState(true);
  const cur = steps[step];
  const adv = (p = true) => {
    if (!p) setPerfect(false);
    if (step + 1 < steps.length) setStep(step + 1);
    else onDone(perfect && p);
  };
  const lose = () => setPerfect(false);

  return (
    <div>
      <div className="mb-4 flex justify-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-3 w-12 rounded-full",
              i < step ? "bg-mint" : i === step ? "bg-butter ring-2 ring-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
      {cur === "kenal" && <MeetShapes onDone={() => adv()} />}
      {cur === "cari" && <FindShape onWrong={lose} onDone={() => adv()} />}
      {cur === "benda" && <ObjectShape onWrong={lose} onDone={() => adv()} />}
      {cur === "ketik" && <TypeShape onWrong={lose} onDone={() => adv()} />}
    </div>
  );
}

function MeetShapes({ onDone }: { onDone: () => void }) {
  const [tapped, setTapped] = useState<ShapeId[]>([]);
  const all = SHAPES.every((s) => tapped.includes(s.id));
  return (
    <div className="space-y-5">
      <Instruction text="Ayo kenalan dengan bentuk! Ketuk setiap kartu untuk mendengar namanya." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SHAPES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              speak(`${s.name}. ${s.fact}`);
              if (!tapped.includes(s.id)) setTapped([...tapped, s.id]);
            }}
            className={cn(
              bigBtn,
              "flex flex-col items-center gap-1 p-3",
              tapped.includes(s.id) ? "bg-mint" : s.color,
            )}
          >
            <ShapeSvg id={s.id} size={80} />
            <span className="font-display text-lg leading-tight">{s.name}</span>
            <span className="text-2xl">{s.examples.map((e) => e.emoji).join(" ")}</span>
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {tapped.length} / {SHAPES.length} bentuk sudah kamu ketuk
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

/** Pilihan jawaban dengan jeda lembut saat salah. */
function useRounds<T>(items: T[], onWrong: () => void, onDone: () => void) {
  const [r, setR] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [cool, setCool] = useState(false);
  const ready = useGateReady();
  const answer = (key: string, correct: boolean) => {
    if (!ready || cool) return;
    if (correct) praiseThen(() => (r + 1 < items.length ? setR(r + 1) : onDone()));
    else {
      onWrong();
      setWrong(key);
      setCool(true);
      tryAgain();
      setTimeout(() => {
        setWrong(null);
        setCool(false);
      }, WRONG_PAUSE_MS);
    }
  };
  return { r, wrong, cool, ready, answer, item: items[r] };
}

function FindShape({ onWrong, onDone }: { onWrong: () => void; onDone: () => void }) {
  const rounds = useMemo(() => shuffle(SHAPES.map((s) => s.id)).slice(0, 5), []);
  const { r, wrong, cool, ready, answer, item } = useRounds(rounds, onWrong, onDone);
  const options = useMemo(
    () =>
      shuffle([item, ...shuffle(SHAPES.map((s) => s.id).filter((x) => x !== item)).slice(0, 3)]),
    [item],
  );
  return (
    <div className="space-y-5">
      <Instruction key={r} text={`Ketuk bentuk ${getShape(item).name}.`} />
      <div className="grid grid-cols-2 gap-4">
        {options.map((id) => (
          <button
            key={id}
            disabled={!ready || cool}
            onClick={() => answer(id, id === item)}
            className={cn(
              bigBtn,
              "flex items-center justify-center bg-card p-4",
              wrong === id && "animate-wiggle bg-rose",
              (!ready || cool) && "opacity-60",
            )}
          >
            <ShapeSvg id={id} size={110} />
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {r + 1} / {rounds.length}
      </p>
    </div>
  );
}

function ObjectShape({ onWrong, onDone }: { onWrong: () => void; onDone: () => void }) {
  const rounds = useMemo(() => shuffle(SHAPE_OBJECTS).slice(0, 5), []);
  const { r, wrong, cool, ready, answer, item } = useRounds(rounds, onWrong, onDone);
  const options = useMemo(
    () =>
      shuffle([
        item.shape,
        ...shuffle(SHAPES.map((s) => s.id).filter((x) => x !== item.shape)).slice(0, 2),
      ]),
    [item],
  );
  return (
    <div className="space-y-5">
      <Instruction
        key={r}
        text={`Bentuk ${item.name} seperti apa? Pilih bentuk yang paling mirip.`}
      />
      <div className="text-center text-8xl">{item.emoji}</div>
      <div className="grid grid-cols-3 gap-3">
        {options.map((id) => (
          <button
            key={id}
            disabled={!ready || cool}
            onClick={() => answer(id, id === item.shape)}
            className={cn(
              bigBtn,
              "flex flex-col items-center gap-1 bg-card p-3",
              wrong === id && "animate-wiggle bg-rose",
              (!ready || cool) && "opacity-60",
            )}
          >
            <ShapeSvg id={id} size={84} />
            <span className="font-display text-base leading-tight">{getShape(id).name}</span>
          </button>
        ))}
      </div>
      <p className="text-center font-display text-lg text-muted-foreground">
        {r + 1} / {rounds.length}
      </p>
    </div>
  );
}

function TypeShape({ onWrong, onDone }: { onWrong: () => void; onDone: () => void }) {
  const rounds = useMemo(() => shuffle(TYPEABLE).slice(0, 3), []);
  const [i, setI] = useState(0);
  const id = rounds[i];
  const shape = getShape(id);
  return (
    <div className="space-y-4">
      <Instruction key={i} text="Tulis nama bentuk ini dengan huruf. Ketuk huruf satu per satu." />
      <TypeAnswer
        key={id}
        target={shape.name}
        speakText={shape.name}
        clue={<ShapeSvg id={id} size={120} />}
        onWrong={onWrong}
        onDone={(p) => {
          if (!p) onWrong();
          if (i + 1 < rounds.length) setI(i + 1);
          else onDone();
        }}
      />
      <p className="text-center font-display text-lg text-muted-foreground">
        {i + 1} / {rounds.length}
      </p>
    </div>
  );
}
