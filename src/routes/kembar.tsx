import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CONFUSABLE_GROUPS } from "@/data/letters";
import { LOWER } from "@/data/strokes";
import { KidPage } from "@/components/kid/TopBar";
import { ConfusableStep } from "@/components/kid/Activities";
import { TraceLetter } from "@/components/kid/Trace";
import { Celebration } from "@/components/kid/Celebration";
import { Instruction } from "@/components/kid/Speaker";
import { addStars } from "@/lib/store";

export const Route = createFileRoute("/kembar")({
  head: () => ({
    meta: [
      { title: "Huruf Kembar b d p q u n m v w — Belajar Ceria" },
      { name: "description", content: "Latihan khusus membedakan huruf yang sering terbalik dengan trik mudah diingat." },
      { property: "og:title", content: "Huruf Kembar — Belajar Ceria" },
      { property: "og:description", content: "Latihan membedakan b, d, p, q, u, n, m, v, w." },
    ],
  }),
  component: Twins,
});

function Twins() {
  const [g, setG] = useState<number | null>(null);
  const [phase, setPhase] = useState<"play" | "trace">("play");
  const [t, setT] = useState(0);
  const [win, setWin] = useState(false);

  if (g === null)
    return (
      <KidPage title="Huruf Kembar">
        <Instruction text="Huruf ini sering tertukar. Pilih satu kelompok untuk berlatih." />
        <div className="mt-6 grid gap-4">
          {CONFUSABLE_GROUPS.map((grp, i) => (
            <button key={i} onClick={() => { setG(i); setPhase("play"); setT(0); }}
              className="rounded-3xl bg-lilac p-6 font-display text-7xl tracking-[0.3em] shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none">
              {grp.join("")}
            </button>
          ))}
        </div>
      </KidPage>
    );

  const grp = CONFUSABLE_GROUPS[g];
  return (
    <KidPage title={grp.join(" ")}>
      {phase === "play" ? (
        <ConfusableStep group={grp} onDone={(perfect = true) => { addStars(perfect ? 2 : 1); setPhase("trace"); }} />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Instruction key={t} text={`Sekarang tulis huruf ${grp[t]}. Mulai dari titik hijau.`} />
          <div className="font-display text-4xl">{grp[t]}</div>
          <TraceLetter key={t} strokes={LOWER[grp[t]]} onDone={() => (t + 1 < grp.length ? setT(t + 1) : (addStars(2), setWin(true)))} />
        </div>
      )}
      {win && <Celebration stars={3} sticker="🏆" message="Luar biasa! Kamu jago membedakan huruf kembar!" onClose={() => { setWin(false); setG(null); }} />}
    </KidPage>
  );
}
