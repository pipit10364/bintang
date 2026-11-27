import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { KidPage } from "@/components/kid/TopBar";
import { Celebration } from "@/components/kid/Celebration";
import { Instruction } from "@/components/kid/Speaker";
import {
  AlphabetFill, AppleCode, CircleSame, CodeStep, FillDots, MatchLines, SyllableListen, SyllableTable, SyllableTree,
} from "@/components/kid/Latihan";
import {
  LEVELS, appleLevel, blankCount, circleLevel, codeColors, codePictures, dotLevel, fillDots, mathPairs, wordPairs,
} from "@/lib/latihan";
import { unlockedLevel, useLatihanProgress } from "@/lib/latihanProgress";
import { addStars } from "@/lib/store";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/latihan")({
  head: () => ({
    meta: [
      { title: "Latihan Seru — Belajar Ceria" },
      { name: "description", content: "Hubungkan hitungan, coding gambar dan warna, huruf kembar, abjad, dan suku kata. Masing-masing 10 level." },
      { property: "og:title", content: "Latihan Seru — Belajar Ceria" },
      { property: "og:description", content: "Latihan seru ala lembar kerja untuk anak SD, 10 level per tema." },
    ],
  }),
  component: Latihan,
});

type Id =
  | "hitung" | "suku" | "coding-gambar" | "coding-warna" | "apel" | "lingkari"
  | "abjad-besar" | "abjad-kecil" | "tabel" | "dengar" | "isi";
const MENU: { id: Id; icon: string; label: string; bg: string }[] = [
  { id: "hitung", icon: "➕", label: "Hubungkan hitungan", bg: "bg-peach" },
  { id: "suku", icon: "🔗", label: "Hubungkan suku kata", bg: "bg-mint" },
  { id: "coding-gambar", icon: "🦋", label: "Coding gambar", bg: "bg-sky" },
  { id: "coding-warna", icon: "🎨", label: "Coding warna", bg: "bg-lilac" },
  { id: "apel", icon: "🍎", label: "Warnai apel huruf", bg: "bg-rose" },
  { id: "lingkari", icon: "⭕", label: "Lingkari huruf sama", bg: "bg-butter" },
  { id: "abjad-besar", icon: "🔠", label: "Abjad besar", bg: "bg-mint" },
  { id: "abjad-kecil", icon: "🔡", label: "Abjad kecil", bg: "bg-sky" },
  { id: "tabel", icon: "📋", label: "Tabel suku kata", bg: "bg-peach" },
  { id: "dengar", icon: "🔊", label: "Dengar & pilih suku kata", bg: "bg-lilac" },
  { id: "isi", icon: "✏️", label: "Isi titik suku kata", bg: "bg-rose" },
];

function Latihan() {
  const [theme, setTheme] = useState<Id | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [win, setWin] = useState<{ stars: number } | null>(null);
  const { progress, record } = useLatihanProgress();

  const finish = (perfect = true) => {
    const stars = perfect ? 3 : 2;
    const gained = record(theme!, level!, stars);
    if (gained > 0) addStars(gained);
    setWin({ stars });
  };
  const back = () => {
    if (level !== null) { setWin(null); setLevel(null); }
    else if (theme !== null) setTheme(null);
  };

  if (!theme)
    return (
      <KidPage title="Latihan Seru">
        <Instruction text="Pilih latihan yang kamu suka." />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {MENU.map((m) => {
            const done = Object.keys(progress[m.id] ?? {}).length;
            return (
              <button key={m.id} data-testid={`menu-${m.id}`} onClick={() => { setTheme(m.id); speak(m.label); }}
                className={`${m.bg} rounded-3xl p-4 text-center shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none`}>
                <div className="text-5xl">{m.icon}</div>
                <div className="mt-1 font-display text-lg leading-tight">{m.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{done}/{LEVELS} level</div>
              </button>
            );
          })}
        </div>
      </KidPage>
    );

  const meta = MENU.find((m) => m.id === theme)!;

  if (level === null) {
    const open = unlockedLevel(progress, theme);
    return (
      <KidPage title={meta.label} onBack={back}>
        <Instruction text="Pilih levelnya. Selesaikan satu level untuk membuka level berikutnya." />
        <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: LEVELS }, (_, i) => i + 1).map((n) => {
            const locked = n > open;
            const stars = progress[theme]?.[n] ?? 0;
            return (
              <button
                key={n}
                data-testid={`level-${n}`}
                disabled={locked}
                onClick={() => { setLevel(n); setRound((r) => r + 1); speak(`Level ${n}`); }}
                className={`${locked ? "bg-muted text-muted-foreground" : meta.bg} flex aspect-square flex-col items-center justify-center rounded-2xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none ${n === open && !stars ? "animate-pulse ring-4 ring-ink/40" : ""}`}
              >
                <span className="font-display text-3xl">{locked ? "🔒" : n}</span>
                <span className="text-xs">{locked ? "" : stars ? "⭐".repeat(stars) : "baru"}</span>
              </button>
            );
          })}
        </div>
      </KidPage>
    );
  }

  return (
    <KidPage title={`${meta.label} · Level ${level}`} onBack={back}>
      <Play key={`${theme}-${level}-${round}`} id={theme} level={level} onDone={finish} />
      {win && (
        <Celebration
          stars={win.stars}
          sticker="🏆"
          message={`Hebat! Level ${level} selesai!`}
          onClose={() => { setWin(null); setLevel(null); }}
        />
      )}
    </KidPage>
  );
}

function Play({ id, level, onDone }: { id: Id; level: number; onDone: (perfect?: boolean) => void }) {
  const data = useMemo(() => {
    switch (id) {
      case "hitung": return mathPairs(level);
      case "suku": return wordPairs(level);
      case "coding-gambar": return codePictures(level);
      case "coding-warna": return codeColors(level);
      case "isi": return fillDots(level);
      default: return null;
    }
  }, [id, level]);

  switch (id) {
    case "hitung": return <MatchLines pairs={data as ReturnType<typeof mathPairs>} text="Hubungkan hitungan dengan jawabannya." onDone={onDone} />;
    case "suku": return <MatchLines pairs={data as ReturnType<typeof wordPairs>} text="Hubungkan suku kata dengan katanya." onDone={onDone} />;
    case "coding-gambar": return <CodeStep {...(data as ReturnType<typeof codePictures>)} text="Setiap gambar punya nilai. Jumlahkan gambarnya." onDone={onDone} />;
    case "coding-warna": return <CodeStep {...(data as ReturnType<typeof codeColors>)} text="Setiap warna punya angka. Jumlahkan warnanya." onDone={onDone} />;
    case "apel": { const a = appleLevel(level); return <AppleCode group={a.group} rounds={a.rounds} onDone={onDone} />; }
    case "lingkari": return <CircleSame cfg={circleLevel(level)} onDone={onDone} />;
    case "abjad-besar": return <AlphabetFill upper blanks={blankCount(level)} onDone={onDone} />;
    case "abjad-kecil": return <AlphabetFill upper={false} blanks={blankCount(level)} onDone={onDone} />;
    case "tabel": return <SyllableTable level={level} onDone={onDone} />;
    case "dengar": return <SyllableListen level={level} onDone={onDone} />;
    case "isi": {
      const qs = data as ReturnType<typeof fillDots>;
      return dotLevel(level).kind === "tree" ? <SyllableTree qs={qs} onDone={onDone} /> : <FillDots qs={qs} onDone={onDone} />;
    }
  }
}
