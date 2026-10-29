import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { MAX_LAYERS, PaintEngine, type Tool } from "@/lib/paint-engine";
import { TEMPLATES } from "@/lib/paint-templates";
import { vibrateTick } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { ColorWheel } from "./ColorWheel";

const bigBtn =
  "rounded-2xl shadow-[0_4px_0_var(--border)] active:translate-y-1 active:shadow-none transition select-none";

/** 35 warna dalam lingkaran, 7 kolom: netral, merah-kuning, hijau-biru, ungu, merah muda dan pastel. */
const PALETTE = [
  "#1b1b1b", "#555555", "#999999", "#dddddd", "#ffffff", "#7a4b2a", "#c89b6d",
  "#b71c1c", "#e53935", "#ff7043", "#fb8c00", "#ffb300", "#ffd54f", "#fff176",
  "#cddc39", "#8bc34a", "#43a047", "#1b5e20", "#26a69a", "#00acc1", "#4dd0e1",
  "#29b6f6", "#1e88e5", "#1a237e", "#5e35b1", "#8e24aa", "#ba68c8", "#e1bee7",
  "#ad1457", "#ec407a", "#f48fb1", "#ffccbc", "#ffe0b2", "#c5e1a5", "#b3e5fc",
];

const RECENT_KEY = "bintang-paint-recent";
const loadRecent = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
};

const TOOLS: { id: Tool; icon: string; name: string }[] = [
  { id: "brush", icon: "🖌️", name: "Kuas" },
  { id: "gradbrush", icon: "🌈", name: "Kuas Gradasi" },
  { id: "eraser", icon: "🧽", name: "Penghapus" },
  { id: "fill", icon: "🪣", name: "Isi Warna" },
  { id: "gradient", icon: "🌅", name: "Gradasi" },
];

const TOOL_HELP: Record<Tool, string> = {
  brush: "Gambar dengan jari. Pilih warna di tab Warna.",
  gradbrush: "Warna goresan berubah pelan-pelan dari Warna 1 ke Warna 2.",
  eraser: "Hapus bagian gambar di lapisan yang sedang dipilih.",
  fill: "Ketuk bagian bergaris yang mau diwarnai. Garis yang terbuka bisa bikin warnanya bocor.",
  gradient: "Ketuk lalu geser: dari titik awal (Warna 1) ke titik akhir (Warna 2).",
};

type Panel = "warna" | "kuas" | "lapisan" | "mewarnai";

export function PaintStudio() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [eng, setEng] = useState<PaintEngine | null>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const e = new PaintEngine(stageRef.current!);
    e.newBlank(false); // kertas kosong langsung tampil; diganti gambar tersimpan bila ada
    void e.load();
    const un = e.subscribe(bump);
    setEng(e);
    const flush = () => void e.save();
    const hide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", flush);
    return () => {
      un();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", flush);
      e.destroy();
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] md:grid-rows-[auto_1fr]">
      <div
        ref={stageRef}
        aria-label="Kertas gambar"
        className="mx-auto aspect-square w-full max-w-[min(100%,calc(100dvh-15rem))] rounded-3xl shadow-[0_6px_0_var(--border)] md:col-start-1 md:row-start-1"
      />
      {eng && <Controls eng={eng} />}
    </div>
  );
}

function Controls({ eng }: { eng: PaintEngine }) {
  const [panel, setPanel] = useState<Panel>("warna");
  const [slot, setSlot] = useState<1 | 2>(1);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [note, setNote] = useState("");

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote((n) => (n === msg ? "" : n)), 2500);
  };

  const remember = useCallback((hex: string) => {
    setRecent((r) => {
      const next = [hex, ...r.filter((x) => x.toLowerCase() !== hex.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
  }, []);

  const color = slot === 1 ? eng.color1 : eng.color2;
  const setColor = (hex: string) => {
    if (eng.tool === "eraser") eng.set({ tool: "brush" });
    eng.set(slot === 1 ? { color1: hex } : { color2: hex });
  };
  const usesTwoColors = eng.tool === "gradbrush" || eng.tool === "gradient";

  const save = async () => {
    try {
      const blob = await eng.exportPng();
      const file = new File([blob], "gambarku.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: "Gambarku" });
          return;
        } catch {
          /* dibatalkan: lanjut unduh */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gambarku.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      flash("Gambar disimpan ke perangkat.");
    } catch {
      flash("Gambar belum bisa disimpan.");
    }
  };

  const startNew = (id: string | null) => {
    if (!eng.isEmpty() && !window.confirm("Gambar yang sekarang akan diganti. Lanjut?")) return;
    if (id) eng.newTemplate(id);
    else eng.newBlank();
    setPanel("warna");
  };

  const Tab = ({ id, icon, label }: { id: Panel; icon: string; label: string }) => (
    <button
      type="button"
      onClick={() => setPanel(id)}
      className={cn(bigBtn, "flex-1 py-2 font-display text-sm sm:text-base", panel === id ? "bg-butter ring-2 ring-primary" : "bg-card")}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  );

  return (
    <>
      <div className="space-y-3 md:col-start-1 md:row-start-2">
        <p className="text-center text-sm text-muted-foreground">{note || TOOL_HELP[eng.tool]}</p>

        <div className="flex flex-wrap justify-center gap-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-label={t.name}
              aria-pressed={eng.tool === t.id}
              onClick={() => {
                vibrateTick();
                eng.set({ tool: t.id });
              }}
              className={cn(bigBtn, "flex h-16 w-16 flex-col items-center justify-center text-2xl", eng.tool === t.id ? "bg-butter ring-4 ring-primary" : "bg-card")}
            >
              {t.icon}
              <span className="text-[10px] leading-none">{t.name}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" aria-label="Urungkan" disabled={!eng.canUndo} onClick={() => eng.undo()} className={cn(bigBtn, "h-12 w-16 bg-sky text-2xl", !eng.canUndo && "opacity-40")}>
            ↩️
          </button>
          <button type="button" aria-label="Ulangi" disabled={!eng.canRedo} onClick={() => eng.redo()} className={cn(bigBtn, "h-12 w-16 bg-sky text-2xl", !eng.canRedo && "opacity-40")}>
            ↪️
          </button>
          <button type="button" onClick={save} className={cn(bigBtn, "h-12 bg-success px-5 font-display text-lg text-primary-foreground")}>
            💾 Simpan
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl bg-card p-3 md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">
        <div className="flex gap-2">
          <Tab id="warna" icon="🎨" label="Warna" />
          <Tab id="kuas" icon="🖌️" label="Kuas" />
          <Tab id="lapisan" icon="📚" label="Lapisan" />
          <Tab id="mewarnai" icon="🖍️" label="Mewarnai" />
        </div>

        {panel === "warna" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              {([1, 2] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`Warna ${n}`}
                  aria-pressed={slot === n}
                  onClick={() => setSlot(n)}
                  className={cn("flex h-16 w-16 items-center justify-center rounded-full border-4 border-white font-display text-xl text-white shadow-[0_0_0_2px_var(--border)] [text-shadow:0_1px_2px_rgba(0,0,0,.6)]", slot === n && "ring-4 ring-primary")}
                  style={{ background: n === 1 ? eng.color1 : eng.color2 }}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                aria-label="Tukar warna 1 dan 2"
                onClick={() => eng.set({ color1: eng.color2, color2: eng.color1 })}
                className={cn(bigBtn, "h-12 w-12 bg-muted text-2xl")}
              >
                ⇄
              </button>
              <div
                aria-hidden
                className={cn("h-10 flex-1 rounded-full border-2 border-white shadow-[0_0_0_2px_var(--border)]", !usesTwoColors && "opacity-40")}
                style={{ background: `linear-gradient(to right, ${eng.color1}, ${eng.color2})` }}
              />
            </div>
            {!usesTwoColors && <p className="text-center text-xs text-muted-foreground">Warna 2 dipakai untuk gradasi.</p>}

            <ColorWheel value={color} onChange={setColor} onCommit={remember} />

            <div className="grid grid-cols-7 justify-items-center gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Warna ${c}`}
                  onClick={() => {
                    setColor(c);
                    remember(c);
                  }}
                  className={cn("h-9 w-9 rounded-full border-2 border-white shadow-[0_0_0_1.5px_var(--border)] active:scale-90", color.toLowerCase() === c && "ring-4 ring-primary")}
                  style={{ background: c }}
                />
              ))}
            </div>
            {recent.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Warna terakhir</p>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Warna terakhir ${c}`}
                      onClick={() => setColor(c)}
                      className="h-9 w-9 rounded-full border-2 border-white shadow-[0_0_0_1.5px_var(--border)] active:scale-90"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {panel === "kuas" && (
          <div className="space-y-4 p-1">
            <label className="block">
              <span className="font-display text-base">Ukuran kuas: {eng.size}</span>
              <input
                type="range"
                min={2}
                max={90}
                value={eng.size}
                onChange={(e) => eng.set({ size: Number(e.target.value) })}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </label>
            <div className="flex h-24 items-center justify-center rounded-2xl bg-muted/60">
              <span
                className="rounded-full"
                style={{
                  width: Math.max(4, eng.size * 0.9),
                  height: Math.max(4, eng.size * 0.9),
                  background: eng.tool === "eraser" ? "#fff" : eng.color1,
                  opacity: eng.alpha,
                  boxShadow: "0 0 0 2px rgba(0,0,0,.2)",
                }}
              />
            </div>
            <label className="block">
              <span className="font-display text-base">Tebal warna: {Math.round(eng.alpha * 100)}%</span>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(eng.alpha * 100)}
                onChange={(e) => eng.set({ alpha: Number(e.target.value) / 100 })}
                className="mt-1 w-full accent-[var(--primary)]"
              />
            </label>
            <div>
              <p className="mb-1 font-display text-base">Bentuk gradasi</p>
              <div className="flex gap-2">
                {([
                  ["linear", "➡️ Lurus"],
                  ["radial", "🎯 Melingkar"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => eng.set({ gradKind: k })}
                    className={cn(bigBtn, "flex-1 py-2 font-display", eng.gradKind === k ? "bg-butter ring-2 ring-primary" : "bg-muted")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {panel === "lapisan" && <LayerPanel eng={eng} />}

        {panel === "mewarnai" && (
          <div className="space-y-3 p-1">
            <p className="text-sm text-muted-foreground">
              Pilih gambar garis untuk diwarnai. Warnanya ada di lapisan bawah, jadi garisnya tidak ikut tertimpa.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" onClick={() => startNew(t.id)} className={cn(bigBtn, "flex flex-col items-center bg-peach py-3")}>
                  <span className="text-4xl">{t.emoji}</span>
                  <span className="font-display text-sm">{t.name}</span>
                </button>
              ))}
              <button type="button" onClick={() => startNew(null)} className={cn(bigBtn, "flex flex-col items-center bg-mint py-3")}>
                <span className="text-4xl">📄</span>
                <span className="font-display text-sm">Kertas kosong</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Thumb({ eng, index, version }: { eng: PaintEngine; index: number; version: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const src = eng.layers[index]?.canvas;
    if (!c || !src) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(src, 0, 0, c.width, c.height);
  }, [eng, index, version]);
  return (
    <canvas
      ref={ref}
      width={48}
      height={48}
      className="h-12 w-12 shrink-0 rounded-lg border border-border"
      style={{ background: "repeating-conic-gradient(#e6e6e6 0% 25%, #fff 0% 50%) 0 0 / 12px 12px" }}
    />
  );
}

function LayerPanel({ eng }: { eng: PaintEngine }) {
  const cur = eng.current!;
  return (
    <div className="space-y-3 p-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={eng.layers.length >= MAX_LAYERS}
          onClick={() => eng.addLayer()}
          className={cn(bigBtn, "flex-1 bg-success py-2 font-display text-primary-foreground", eng.layers.length >= MAX_LAYERS && "opacity-40")}
        >
          ➕ Lapisan baru
        </button>
        <button
          type="button"
          aria-label="Hapus lapisan"
          onClick={() => eng.layers.length > 1 && window.confirm("Hapus lapisan ini?") && eng.deleteLayer()}
          disabled={eng.layers.length <= 1}
          className={cn(bigBtn, "w-14 bg-rose text-2xl", eng.layers.length <= 1 && "opacity-40")}
        >
          🗑️
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Lapisan paling atas ada di paling atas daftar. Maksimal {MAX_LAYERS} lapisan.</p>

      <ul className="space-y-2">
        {eng.layers
          .map((l, i) => ({ l, i }))
          .reverse()
          .map(({ l, i }) => (
            <li
              key={l.id}
              className={cn("flex items-center gap-2 rounded-2xl p-2", i === eng.active ? "bg-butter ring-2 ring-primary" : "bg-muted/60")}
            >
              <button type="button" aria-label={`Pilih ${l.name}`} onClick={() => eng.select(i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Thumb eng={eng} index={i} version={eng.version} />
                <span className="truncate font-display text-base">{l.name}</span>
              </button>
              <button type="button" aria-label={l.visible ? "Sembunyikan lapisan" : "Tampilkan lapisan"} onClick={() => eng.setVisible(i, !l.visible)} className="h-10 w-10 rounded-full bg-card text-xl">
                {l.visible ? "👁️" : "🚫"}
              </button>
              <div className="flex flex-col">
                <button type="button" aria-label="Naikkan lapisan" disabled={i === eng.layers.length - 1} onClick={() => eng.moveLayer(i, 1)} className="h-5 w-8 text-xs disabled:opacity-30">
                  ▲
                </button>
                <button type="button" aria-label="Turunkan lapisan" disabled={i === 0} onClick={() => eng.moveLayer(i, -1)} className="h-5 w-8 text-xs disabled:opacity-30">
                  ▼
                </button>
              </div>
            </li>
          ))}
      </ul>

      <label className="block">
        <span className="font-display text-base">
          Tembus pandang "{cur.name}": {Math.round(cur.opacity * 100)}%
        </span>
        <input
          type="range"
          min={10}
          max={100}
          value={Math.round(cur.opacity * 100)}
          onChange={(e) => eng.setOpacity(eng.active, Number(e.target.value) / 100)}
          className="mt-1 w-full accent-[var(--primary)]"
        />
      </label>
      <button
        type="button"
        onClick={() => window.confirm(`Kosongkan "${cur.name}"?`) && eng.clearLayer()}
        className={cn(bigBtn, "w-full bg-muted py-2 font-display")}
      >
        🧹 Kosongkan lapisan ini
      </button>
    </div>
  );
}
