// Aktivitas "Latihan Seru": terinspirasi lembar kerja (hubungkan, coding, huruf kembar, abjad, suku kata).
import { useMemo, useState } from "react";
import { speak, speakSyllable } from "@/lib/speech";
import { vibrateNo, vibrateOk } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Instruction, praiseThen, tryAgain, useGateReady, WRONG_PAUSE_MS } from "./Speaker";
import {
  ABC, LINE_COLORS, VOWELS, circleCells, letterCodes, letterSequence, pickBlanks, pickTargets, shuffle, syllableQuiz,
  tableRows, type CircleCfg, type CodeQ, type DotQ, type Pair, type Sym,
} from "@/lib/latihan";

const bigBtn = "rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none transition";
type Done = (perfect?: boolean) => void;

function useWrong() {
  const [cool, setCool] = useState(false);
  return {
    cool,
    wrong: (fn?: () => void) => {
      fn?.();
      vibrateNo();
      setCool(true);
      tryAgain();
      setTimeout(() => setCool(false), WRONG_PAUSE_MS);
    },
  };
}

/* ---------- Hubungkan dua kolom ---------- */
const ROW = 72;
export function MatchLines({ pairs, text, onDone }: { pairs: Pair[]; text: string; onDone: Done }) {
  const right = useMemo(() => shuffle(pairs), [pairs]);
  const [sel, setSel] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, number>>({}); // id -> indeks kanan
  const [perfect, setPerfect] = useState(true);
  const [bad, setBad] = useState<string | null>(null);
  const { cool, wrong } = useWrong();
  const n = pairs.length;

  const pickRight = (j: number) => {
    if (!sel || cool) return;
    const p = right[j];
    if (p.id === sel) {
      const next = { ...done, [sel]: j };
      setDone(next);
      setSel(null);
      vibrateOk();
      speak(`${pairs.find((x) => x.id === sel)!.say}, sama dengan ${p.sayRight}`);
      if (Object.keys(next).length === n) setTimeout(() => praiseThen(() => onDone(perfect)), 900);
    } else {
      wrong(() => setPerfect(false));
      setBad(right[j].id);
      setTimeout(() => setBad(null), 900);
    }
  };

  return (
    <div className="space-y-4">
      <Instruction text={text} />
      <div className="relative grid grid-cols-[35%_30%_35%]">
        <div>
          {pairs.map((p, i) => (
            <div key={p.id} style={{ height: ROW }} className="flex items-center justify-center p-1">
              <button
                data-testid={`l-${i}`}
                disabled={p.id in done}
                onClick={() => { setSel(p.id); speak(p.say); }}
                className={cn(bigBtn, "h-full w-full font-display text-2xl", sel === p.id ? "bg-butter ring-4 ring-ink" : "bg-card")}
                style={p.id in done ? { background: LINE_COLORS[i % 8], color: "#fff" } : undefined}
              >
                {p.left}
              </button>
            </div>
          ))}
        </div>
        <svg className="pointer-events-none" width="100%" height={n * ROW} viewBox={`0 0 100 ${n * 100}`} preserveAspectRatio="none">
          {pairs.map((p, i) =>
            p.id in done ? (
              <line key={p.id} x1="0" x2="100" y1={i * 100 + 50} y2={done[p.id] * 100 + 50} stroke={LINE_COLORS[i % 8]} strokeWidth="6" strokeLinecap="round" style={{ vectorEffect: "non-scaling-stroke" }} />
            ) : null,
          )}
        </svg>
        <div>
          {right.map((p, j) => {
            const li = pairs.findIndex((x) => x.id === p.id);
            const matched = p.id in done && done[p.id] === j;
            return (
              <div key={p.id} style={{ height: ROW }} className="flex items-center justify-center p-1">
                <button
                  data-testid={`r-${j}`}
                  disabled={matched}
                  onClick={() => pickRight(j)}
                  className={cn(bigBtn, "h-full w-full font-display text-2xl", bad === p.id ? "animate-wiggle bg-rose" : "bg-card")}
                  style={matched ? { background: LINE_COLORS[li % 8], color: "#fff" } : undefined}
                >
                  {p.right}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">Ketuk satu di kiri, lalu pasangannya di kanan.</p>
    </div>
  );
}

/* ---------- Coding: gambar atau warna bernilai angka ---------- */
function SymView({ s, size = "text-4xl" }: { s: Sym; size?: string }) {
  return <span className={size} style={s.color ? { color: s.color } : undefined} aria-label={s.name}>{s.glyph}</span>;
}

export function CodeStep({ legend, questions, text, onDone }: { legend: Sym[]; questions: CodeQ[]; text: string; onDone: Done }) {
  const [i, setI] = useState(0);
  const [wrongN, setWrongN] = useState<number | null>(null);
  const [perfect, setPerfect] = useState(true);
  const ready = useGateReady();
  const { cool, wrong } = useWrong();
  const q = questions[i];
  const say = `${q.syms.map((s) => s.name).join(" tambah ")}. Jadi berapa?`;
  return (
    <div className="space-y-4">
      <Instruction key={i} text={i === 0 ? `${text} ${say}` : say} />
      <div className="flex flex-wrap justify-center gap-2 rounded-3xl bg-card p-3 shadow-sm">
        {legend.map((s) => (
          <div key={s.key} className="flex items-center gap-1 rounded-2xl bg-mint px-3 py-1 font-display text-2xl">
            <SymView s={s} size="text-3xl" /> = {s.value}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 rounded-3xl bg-sky p-5 font-display text-4xl">
        {q.syms.map((s, k) => (
          <span key={k} className="flex items-center gap-2">
            {k > 0 && <span>+</span>}
            <SymView s={s} size="text-5xl" />
          </span>
        ))}
        <span>= ?</span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${q.options.length}, minmax(0, 1fr))` }}>
        {q.options.map((o) => (
          <button
            key={o}
            disabled={!ready || cool}
            onClick={() => {
              if (o === q.answer) {
                vibrateOk();
                praiseThen(() => (i + 1 < questions.length ? setI(i + 1) : onDone(perfect)));
              } else {
                wrong(() => setPerfect(false));
                setWrongN(o);
                setTimeout(() => setWrongN(null), 900);
              }
            }}
            className={cn(bigBtn, "py-6 font-display text-5xl", wrongN === o ? "animate-wiggle bg-rose" : "bg-peach")}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">Soal {i + 1} dari {questions.length}</p>
    </div>
  );
}

/* ---------- Warnai apel sesuai kode huruf ---------- */
export function AppleCode({ group, rounds, onDone }: { group: readonly string[]; rounds: number; onDone: Done }) {
  const codes = useMemo(() => letterCodes(group), [group]);
  const seq = useMemo(() => letterSequence(group, rounds), [group, rounds]);
  const [colored, setColored] = useState<Record<number, string>>({});
  const [pick, setPick] = useState<string | null>(null);
  const [bad, setBad] = useState<number | null>(null);
  const [perfect, setPerfect] = useState(true);
  const ready = useGateReady();
  const { cool, wrong } = useWrong();
  const desc = codes.map((c) => `${c.letter} ${c.name}`).join(", ");

  const tapApple = (k: number) => {
    if (!ready || cool || k in colored) return;
    if (!pick) { speak("Pilih warnanya dulu ya."); return; }
    const want = codes.find((c) => c.letter === seq[k])!;
    if (want.color === pick) {
      vibrateOk();
      const next = { ...colored, [k]: pick };
      setColored(next);
      if (Object.keys(next).length === seq.length) setTimeout(() => praiseThen(() => onDone(perfect)), 700);
    } else {
      wrong(() => setPerfect(false));
      setBad(k);
      speak(`Huruf ${seq[k]} warnanya ${want.name}.`);
      setTimeout(() => setBad(null), 900);
    }
  };
  return (
    <div className="space-y-4">
      <Instruction text={`Warnai apel sesuai kode. ${desc}.`} />
      <div className="flex flex-wrap justify-center gap-3">
        {codes.map((c) => (
          <button
            key={c.letter}
            data-testid={`pal-${c.letter}`}
            onClick={() => setPick(c.color)}
            className={cn(bigBtn, "flex h-16 w-16 flex-col items-center justify-center font-display text-3xl", pick === c.color && "ring-4 ring-ink")}
            style={{ background: c.color, color: c.color === "#fdd835" ? "#333" : "#fff" }}
          >
            {c.letter}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {seq.map((l, k) => (
          <button
            key={k}
            data-testid={`apple-${k}`}
            onClick={() => tapApple(k)}
            className={cn("relative flex aspect-square items-center justify-center rounded-full border-4 border-ink/30 bg-card transition", bad === k && "animate-wiggle")}
            style={colored[k] ? { background: colored[k] } : undefined}
          >
            <span className="font-display text-4xl" style={colored[k] ? { color: colored[k] === "#fdd835" ? "#333" : "#fff" } : undefined}>{l}</span>
            <span className="absolute -top-2 text-2xl">🍎</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Lingkari huruf yang sama ---------- */
export function CircleSame({ cfg, onDone }: { cfg: CircleCfg; onDone: Done }) {
  const targets = useMemo(() => pickTargets(cfg.pool, cfg.rounds), [cfg]);
  const [r, setR] = useState(0);
  const target = targets[r];
  const cells = useMemo(() => circleCells(cfg.pool, target, cfg.cells, cfg.hits), [cfg, target, r]); // eslint-disable-line react-hooks/exhaustive-deps
  const [hit, setHit] = useState<Set<number>>(new Set());
  const [bad, setBad] = useState<number | null>(null);
  const [perfect, setPerfect] = useState(true);
  const ready = useGateReady();
  const { cool, wrong } = useWrong();
  const need = cfg.hits;
  return (
    <div className="space-y-4">
      <Instruction key={r} text={`Lingkari semua huruf ${target}.`} />
      <div className="flex items-center justify-center gap-3">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-butter font-display text-6xl">{target}</div>
        <span className="text-sm text-muted-foreground">{hit.size} dari {need} · putaran {r + 1}/{targets.length}</span>
      </div>
      <div className={cn("grid gap-3", cfg.cells > 16 ? "grid-cols-5" : "grid-cols-4")}>
        {cells.map((c, k) => (
          <button
            key={`${r}-${k}`}
            data-testid={`cell-${k}`}
            disabled={!ready || cool || hit.has(k)}
            onClick={() => {
              if (c === target) {
                vibrateOk();
                const nh = new Set(hit).add(k);
                setHit(nh);
                if (nh.size === need)
                  praiseThen(() => {
                    if (r + 1 < targets.length) { setR(r + 1); setHit(new Set()); } else onDone(perfect);
                  });
              } else {
                wrong(() => setPerfect(false));
                setBad(k);
                setTimeout(() => setBad(null), 900);
              }
            }}
            className={cn(bigBtn, "aspect-square font-display text-5xl", hit.has(k) ? "bg-success text-white ring-4 ring-ink/40" : bad === k ? "animate-wiggle bg-rose" : "bg-card")}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Isi huruf abjad yang hilang ---------- */
export function AlphabetFill({ upper, blanks: n, onDone }: { upper: boolean; blanks: number; onDone: Done }) {
  const blanks = useMemo(() => pickBlanks(n), [n]);
  const tray = useMemo(() => shuffle(blanks), [blanks]);
  const [filled, setFilled] = useState<Record<number, true>>({});
  const [sel, setSel] = useState<number | null>(null);
  const [perfect, setPerfect] = useState(true);
  const [bad, setBad] = useState<number | null>(null);
  const { cool, wrong } = useWrong();
  const show = (i: number) => (upper ? ABC[i].toUpperCase() : ABC[i]);

  const tapSlot = (i: number) => {
    if (!blanks.includes(i) || filled[i] || cool) return;
    if (sel === null) { speak("Pilih hurufnya dulu di bawah."); return; }
    if (sel === i) {
      vibrateOk();
      const nf = { ...filled, [i]: true as const };
      setFilled(nf);
      setSel(null);
      speak(ABC[i]);
      if (Object.keys(nf).length === blanks.length) setTimeout(() => praiseThen(() => onDone(perfect)), 600);
    } else {
      wrong(() => setPerfect(false));
      setBad(i);
      setTimeout(() => setBad(null), 900);
    }
  };
  return (
    <div className="space-y-4">
      <Instruction text={upper ? "Isi huruf besar yang hilang. Pilih huruf, lalu ketuk kotak kosong." : "Isi huruf kecil yang hilang. Pilih huruf, lalu ketuk kotak kosong."} />
      <div className="grid grid-cols-6 gap-1.5">
        {ABC.map((_, i) => {
          const empty = blanks.includes(i) && !filled[i];
          return (
            <button
              key={i}
              data-testid={`slot-${i}`}
              onClick={() => tapSlot(i)}
              className={cn("aspect-square rounded-xl border-2 font-display text-2xl", empty ? "border-dashed border-ink/50 bg-butter/60" : "border-transparent bg-card", bad === i && "animate-wiggle bg-rose")}
            >
              {empty ? "" : show(i)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-2 rounded-3xl bg-lilac p-3">
        {tray.filter((i) => !filled[i]).map((i) => (
          <button
            key={i}
            data-testid={`tray-${ABC[i]}`}
            onClick={() => { setSel(i); speak(ABC[i]); }}
            className={cn(bigBtn, "h-14 w-14 bg-card font-display text-3xl", sel === i && "ring-4 ring-ink")}
          >
            {show(i)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Tabel suku kata ---------- */
export function SyllableTable({ level, onDone }: { level: number; onDone: Done }) {
  const rows = tableRows(level);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [last, setLast] = useState<string | null>(null);
  const need = rows.length * VOWELS.length;
  return (
    <div className="space-y-4">
      <Instruction text="Ini tabel suku kata. Ketuk semua kotak untuk mendengar bunyinya." />
      <div className="overflow-x-auto rounded-3xl bg-card p-2 shadow-sm">
        <table className="mx-auto border-separate border-spacing-1 text-center">
          <thead>
            <tr>
              <th />
              {VOWELS.map((v) => (
                <th key={v} className="font-display text-2xl text-primary">{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c}>
                <th className="font-display text-2xl text-primary">{c}</th>
                {VOWELS.map((v) => {
                  const s = c + v;
                  return (
                    <td key={s}>
                      <button
                        data-testid={`syl-${s}`}
                        onClick={() => { speakSyllable(s, 1); vibrateOk(); setLast(s); setHeard((h) => new Set(h).add(s)); }}
                        className={cn("h-11 w-12 rounded-xl font-display text-xl transition active:scale-95", last === s ? "bg-butter ring-2 ring-ink" : heard.has(s) ? "bg-mint" : "bg-peach/60")}
                      >
                        {s}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        data-testid="syl-done"
        disabled={heard.size < need}
        onClick={() => onDone(true)}
        className={cn(bigBtn, "w-full bg-success py-4 font-display text-2xl text-white disabled:opacity-40")}
      >
        {heard.size < need ? `Dengarkan ${need - heard.size} kotak lagi` : "Selesai ✓"}
      </button>
    </div>
  );
}

/* ---------- Dengar suku kata, pilih tulisannya ---------- */
export function SyllableListen({ level, onDone }: { level: number; onDone: Done }) {
  const qs = useMemo(() => syllableQuiz(level), [level]);
  const [i, setI] = useState(0);
  const [reshuffle, setReshuffle] = useState(0);
  const q = qs[i];
  // Pilihan tetap selama belum dijawab; diacak lagi hanya setelah salah.
  const opts = useMemo(() => shuffle(q.options), [q, reshuffle]); // eslint-disable-line react-hooks/exhaustive-deps
  const [bad, setBad] = useState<string | null>(null);
  const [perfect, setPerfect] = useState(true);
  const ready = useGateReady();
  const { cool, wrong } = useWrong();
  return (
    <div className="space-y-4">
      <Instruction key={i} text="Dengarkan bunyinya, lalu pilih tulisan yang benar." />
      <button onClick={() => speakSyllable(q.target, 1)} className={cn(bigBtn, "mx-auto flex h-24 w-24 items-center justify-center bg-butter text-5xl")} aria-label="Dengar lagi">🔊</button>
      <div className="grid grid-cols-2 gap-3">
        {opts.map((o) => (
          <button
            key={o}
            data-testid={`opt-${o}`}
            disabled={!ready || cool}
            onClick={() => {
              if (o === q.target) {
                vibrateOk();
                praiseThen(() => (i + 1 < qs.length ? setI(i + 1) : onDone(perfect)));
              } else {
                wrong(() => setPerfect(false));
                setBad(o);
                setTimeout(() => { setBad(null); setReshuffle((n) => n + 1); }, 900);
              }
            }}
            className={cn(bigBtn, "py-6 font-display text-5xl", bad === o ? "animate-wiggle bg-rose" : "bg-sky")}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">Soal {i + 1} dari {qs.length}</p>
    </div>
  );
}

/* ---------- Isi titik suku kata ---------- */
function DotBox({ ch, hint }: { ch?: string; hint?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-24 w-20 items-center justify-center rounded-2xl border-4 font-display text-6xl",
        ch ? "border-success bg-success/20 text-success" : "border-dashed border-ink/50 bg-butter/50",
        hint && !ch && "animate-pulse",
      )}
    >
      {ch ?? ""}
    </span>
  );
}

export function FillDots({ qs, onDone }: { qs: DotQ[]; onDone: Done }) {
  const [i, setI] = useState(0);
  const [stage, setStage] = useState(0);
  const [first, setFirst] = useState<string | null>(null);
  const [filled, setFilled] = useState(false);
  const [bad, setBad] = useState<string | null>(null);
  const [perfect, setPerfect] = useState(true);
  const [reshuffle, setReshuffle] = useState(0);
  const ready = useGateReady();
  const { cool, wrong } = useWrong();
  const q = qs[i];
  const pool = stage === 0 ? q.options : (q.options2 ?? q.options);
  // Pilihan tetap selama belum dijawab; diacak lagi hanya setelah salah.
  const opts = useMemo(() => shuffle(pool), [pool, reshuffle]); // eslint-disable-line react-hooks/exhaustive-deps
  const want = q.kind === "v" ? q.target[1] : q.kind === "c" ? q.target[0] : stage === 0 ? q.target[0] : q.target[1];

  const next = () => {
    setStage(0);
    setFirst(null);
    setFilled(false);
    if (i + 1 < qs.length) setI(i + 1);
    else onDone(perfect);
  };
  const pick = (o: string) => {
    if (o === want) {
      vibrateOk();
      if (q.kind === "both" && stage === 0) {
        setFirst(o);
        setStage(1);
        speak(o);
        return;
      }
      setFilled(true);
      speakSyllable(q.target, 1, { onEnd: () => praiseThen(next) });
    } else {
      wrong(() => setPerfect(false));
      setBad(o);
      speak(`${q.kind === "c" ? o + q.target[1] : q.kind === "v" ? q.target[0] + o : stage === 0 ? o : (first ?? "") + o}`);
      setTimeout(() => { setBad(null); setReshuffle((n) => n + 1); }, 900);
    }
  };

  const c = q.target[0];
  const v = q.target[1];
  const left =
    q.kind === "v" ? <span className="font-display text-7xl">{c}</span> : <DotBox ch={q.kind === "c" ? (filled ? c : undefined) : first ?? undefined} hint={q.kind === "c" || stage === 0} />;
  const right =
    q.kind === "c" ? <span className="font-display text-7xl">{v}</span> : <DotBox ch={filled ? v : undefined} hint={q.kind === "v" || stage === 1} />;
  const what = q.kind === "v" ? "huruf vokal" : q.kind === "c" ? "huruf konsonan" : stage === 0 ? "huruf pertama" : "huruf kedua";

  return (
    <div className="space-y-4">
      <Instruction key={i} text={i === 0 ? "Tekan speaker, dengarkan bunyinya, lalu isi titik-titiknya." : "Dengarkan, lalu isi titik-titiknya."} />
      <div className="flex items-center justify-center gap-3 rounded-3xl bg-card p-4 shadow-sm">
        {left}
        {right}
        <button onClick={() => speakSyllable(q.target, 1)} aria-label="Dengar bunyinya" data-testid="hear"
          className={cn(bigBtn, "ml-2 flex h-20 w-20 items-center justify-center bg-butter text-4xl")}>🔊</button>
      </div>
      <p className="text-center text-sm text-muted-foreground">Pilih {what}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {opts.map((o) => (
          <button
            key={o}
            data-testid={`pick-${o}`}
            disabled={!ready || cool || filled}
            onClick={() => pick(o)}
            className={cn(bigBtn, "h-20 w-20 font-display text-5xl", bad === o ? "animate-wiggle bg-rose" : "bg-sky")}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">Soal {i + 1} dari {qs.length}</p>
    </div>
  );
}

/** Pohon suku kata: satu konsonan dengan lima vokal. Ketuk baris untuk mendengar, lalu pilih vokalnya. */
export function SyllableTree({ qs, onDone }: { qs: DotQ[]; onDone: Done }) {
  const [i, setI] = useState(0);
  const q = qs[i];
  const rows = useMemo(() => shuffle(VOWELS), [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState<string | null>(null);
  const [filled, setFilled] = useState<string[]>([]);
  const [bad, setBad] = useState<string | null>(null);
  const [perfect, setPerfect] = useState(true);
  const ready = useGateReady();
  const { cool, wrong } = useWrong();
  const c = q.target;

  const pickVowel = (x: string) => {
    if (cool) return;
    if (!sel) { speak("Ketuk barisnya dulu untuk mendengar bunyinya."); return; }
    if (x === sel) {
      vibrateOk();
      const nf = [...filled, x];
      setFilled(nf);
      setSel(null);
      if (nf.length === VOWELS.length)
        setTimeout(() => praiseThen(() => {
          setFilled([]);
          if (i + 1 < qs.length) setI(i + 1); else onDone(perfect);
        }), 500);
    } else {
      wrong(() => setPerfect(false));
      setBad(x);
      setTimeout(() => setBad(null), 900);
    }
  };
  return (
    <div className="space-y-4">
      <Instruction key={i} text={`Pohon suku kata huruf ${c}. Ketuk satu baris, dengarkan, lalu pilih huruf vokalnya.`} />
      <div className="flex items-center justify-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-mint font-display text-6xl shadow-[0_6px_0_var(--border)]">{c}</div>
        <div className="space-y-2">
          {rows.map((x) => {
            const done = filled.includes(x);
            return (
              <button
                key={x}
                data-testid={`row-${x}`}
                disabled={done}
                onClick={() => { setSel(x); speakSyllable(c + x, 1); }}
                className={cn("flex h-14 w-44 items-center justify-center gap-2 rounded-2xl font-display text-3xl shadow-[0_4px_0_var(--border)]", done ? "bg-success text-white" : sel === x ? "bg-butter ring-4 ring-ink" : "bg-card")}
              >
                {done ? c + x : <>🔊 {c}<span className="inline-block h-9 w-10 rounded-lg border-2 border-dashed border-ink/50" /></>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3 rounded-3xl bg-lilac p-3">
        {VOWELS.filter((x) => !filled.includes(x)).map((x) => (
          <button key={x} data-testid={`vow-${x}`} disabled={!ready} onClick={() => pickVowel(x)}
            className={cn(bigBtn, "h-16 w-16 font-display text-4xl", bad === x ? "animate-wiggle bg-rose" : "bg-card")}>{x}</button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">Pohon {i + 1} dari {qs.length}</p>
    </div>
  );
}
