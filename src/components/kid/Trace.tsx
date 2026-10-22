import { useEffect, useMemo, useRef, useState } from "react";
import { speak } from "@/lib/speech";
import { praiseThen } from "./Speaker";

type Pt = { x: number; y: number };

function samplePath(d: string, step = 3): Pt[] {
  if (typeof document === "undefined") return [];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", d);
  svg.appendChild(p);
  svg.style.position = "absolute";
  svg.style.visibility = "hidden";
  document.body.appendChild(svg);
  const len = p.getTotalLength();
  const pts: Pt[] = [];
  for (let l = 0; l <= len; l += step) {
    const q = p.getPointAtLength(l);
    pts.push({ x: q.x, y: q.y });
  }
  const end = p.getPointAtLength(len);
  pts.push({ x: end.x, y: end.y });
  document.body.removeChild(svg);
  return pts;
}

/**
 * Guided tracing: the child must follow each stroke in order and in the right direction.
 * A moving dot + arrow shows where to go; the green dot marks the start.
 */
export function TraceLetter({ strokes, onDone }: { strokes: string[]; onDone: () => void }) {
  const [samples, setSamples] = useState<Pt[][]>([]);
  const [stroke, setStroke] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const drawing = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setSamples(strokes.map((s) => samplePath(s)));
    setStroke(0);
    setProgress(0);
    setDone(false);
  }, [strokes]);

  const pts = samples[stroke] ?? [];
  const toSvg = (e: React.PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const handle = (e: React.PointerEvent) => {
    if (!drawing.current || done || !pts.length) return;
    const p = toSvg(e);
    let next = progress;
    // allow advancing a few samples ahead, never backwards — this enforces direction
    for (let i = progress; i < Math.min(progress + 6, pts.length); i++) {
      const q = pts[i];
      if (Math.hypot(q.x - p.x, q.y - p.y) < 10) next = i + 1;
    }
    if (next !== progress) {
      if (next >= pts.length) {
        if (stroke + 1 >= strokes.length) {
          setDone(true);
          setProgress(next);
          praiseThen(onDone);
        } else {
          speak("Bagus! Sekarang garis berikutnya.");
          setStroke(stroke + 1);
          setProgress(0);
          drawing.current = false;
        }
      } else setProgress(next);
    }
  };

  const partial = useMemo(() => {
    if (!pts.length || progress < 2) return "";
    return "M" + pts.slice(0, progress).map((q) => `${q.x} ${q.y}`).join(" L");
  }, [pts, progress]);

  const start = pts[0];
  const ahead = pts[Math.min(progress + 4, pts.length - 1)];
  const here = pts[Math.min(progress, pts.length - 1)];
  const angle = here && ahead ? (Math.atan2(ahead.y - here.y, ahead.x - here.x) * 180) / Math.PI : 0;

  return (
    <svg
      ref={svgRef}
      viewBox="-5 -5 110 110"
      className="aspect-square w-full max-w-[min(80vw,60vh)] touch-none rounded-[2rem] bg-card shadow-inner"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        drawing.current = true;
        handle(e);
      }}
      onPointerMove={handle}
      onPointerUp={() => (drawing.current = false)}
    >
      {/* writing lines */}
      {[10, 50, 90].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 2" strokeWidth="0.6" />
      ))}
      {strokes.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--guide)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {strokes.map((d, i) => (
        <path key={`d${i}`} d={d} fill="none" stroke="var(--card)" strokeWidth="1.2" strokeDasharray="3 3" />
      ))}
      {strokes.slice(0, stroke).map((d, i) => (
        <path key={`f${i}`} d={d} fill="none" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {done && (
        <path d={strokes[stroke]} fill="none" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {!done && partial && (
        <path d={partial} fill="none" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {!done && start && (
        <>
          {/* animated demo dot moving along the current stroke direction */}
          {progress === 0 && (
            <circle r="3" fill="var(--primary)" opacity="0.7">
              <animateMotion dur="2.2s" repeatCount="indefinite" path={strokes[stroke]} />
            </circle>
          )}
          <circle cx={start.x} cy={start.y} r="6" fill="var(--success)" />
          <text x={start.x} y={start.y + 2.6} textAnchor="middle" fontSize="7" fill="var(--card)" fontWeight="bold">
            {stroke + 1}
          </text>
          {here && progress > 0 && (
            <g transform={`translate(${here.x} ${here.y}) rotate(${angle})`}>
              <path d="M-3 -4 L5 0 L-3 4 Z" fill="var(--primary)" />
            </g>
          )}
        </>
      )}
    </svg>
  );
}

/** Free tracing over big faded text (used for names). */
export function FreeTrace({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.width = r.width * 2;
    c.height = r.height * 2;
  }, [text]);
  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [(e.clientX - r.left) * 2, (e.clientY - r.top) * 2] as const;
  };
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] bg-card" style={{ height: "40vh" }}>
      <div
        className="absolute inset-0 flex items-center justify-center font-display text-guide"
        style={{ fontSize: `min(${Math.max(8, 70 / Math.max(text.length, 1))}vw, 30vh)` }}
      >
        {text}
      </div>
      <canvas
        ref={ref}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = ref.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current!.getContext("2d")!;
          ctx.lineWidth = 22;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink");
          const [x, y] = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={() => (drawing.current = false)}
      />
      <button
        onClick={() => {
          const c = ref.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
        }}
        className="absolute bottom-3 right-3 rounded-full bg-muted px-5 py-3 font-display text-lg"
      >
        🧽 Hapus
      </button>
    </div>
  );
}
