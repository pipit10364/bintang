import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CONFUSABLE_GROUPS } from "@/data/letters";
import { KidPage } from "@/components/kid/TopBar";
import { Celebration } from "@/components/kid/Celebration";
import { Instruction } from "@/components/kid/Speaker";
import {
  AlphabetFill, AppleCode, CircleSame, CodeStep, MatchLines, SyllableListen, SyllableTable,
} from "@/components/kid/Latihan";
import { codeColors, codePictures, sumPairs, wordPairs } from "@/lib/latihan";
import { addStars } from "@/lib/store";

export const Route = createFileRoute("/latihan")({
  head: () => ({
    meta: [
      { title: "Latihan Seru — Belajar Ceria" },
      { name: "description", content: "Hubungkan hitungan, coding gambar dan warna, huruf kembar, abjad, dan tabel suku kata." },
      { property: "og:title", content: "Latihan Seru — Belajar Ceria" },
      { property: "og:description", content: "Latihan seru ala lembar kerja untuk anak SD." },
    ],
  }),
  component: Latihan,
});

type Id = "hitung" | "suku" | "coding-gambar" | "coding-warna" | "apel" | "lingkari" | "abjad-besar" | "abjad-kecil" | "tabel" | "dengar";
const MENU: { id: Id; icon: string; label: string; bg: string }[] = [
  { id: "hitung", icon: "➕", label: "Hubungkan hitungan", bg: "bg-peach" },
  { id: "suku", icon: "🔗", label: "Hubungkan suku kata", bg: "bg-mint" },
  { id: "coding-gambar", icon: "🦋", label: "Coding gambar", bg: "bg-sky" },
  { id: "coding-warna", icon: "🎨", label: "Coding warna", bg: "bg-lilac" },
  { id: "apel", icon: "🍎", label: "Warnai apel b d p q", bg: "bg-rose" },
  { id: "lingkari", icon: "⭕", label: "Lingkari huruf sama", bg: "bg-butter" },
  { id: "abjad-besar", icon: "🔠", label: "Abjad besar", bg: "bg-mint" },
  { id: "abjad-kecil", icon: "🔡", label: "Abjad kecil", bg: "bg-sky" },
  { id: "tabel", icon: "📋", label: "Tabel suku kata", bg: "bg-peach" },
  { id: "dengar", icon: "🔊", label: "Dengar & pilih suku kata", bg: "bg-lilac" },
];

function Latihan() {
  const [id, setId] = useState<Id | null>(null);
  const [round, setRound] = useState(0);
  const [win, setWin] = useState<{ stars: number } | null>(null);
  const [gi, setGi] = useState(0);

  const finish = (perfect = true) => {
    const stars = perfect ? 3 : 2;
    addStars(stars);
    setWin({ stars });
  };
  const pictures = useMemo(() => codePictures(4), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const colors = useMemo(() => codeColors(4), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const sums = useMemo(() => sumPairs(5), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const words = useMemo(() => wordPairs(5), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const group = CONFUSABLE_GROUPS[0];

  if (!id)
    return (
      <KidPage title="Latihan Seru">
        <Instruction text="Pilih latihan yang kamu suka." />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {MENU.map((m) => (
            <button key={m.id} data-testid={`menu-${m.id}`} onClick={() => { setId(m.id); setRound((r) => r + 1); setGi(0); }}
              className={`${m.bg} rounded-3xl p-4 text-center shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none`}>
              <div className="text-5xl">{m.icon}</div>
              <div className="mt-1 font-display text-lg leading-tight">{m.label}</div>
            </button>
          ))}
        </div>
      </KidPage>
    );

  const key = `${id}-${round}`;
  return (
    <KidPage title={MENU.find((m) => m.id === id)!.label}>
      {id === "hitung" && <MatchLines key={key} pairs={sums} text="Hubungkan hitungan dengan jawabannya." onDone={finish} />}
      {id === "suku" && <MatchLines key={key} pairs={words} text="Hubungkan suku kata dengan katanya." onDone={finish} />}
      {id === "coding-gambar" && <CodeStep key={key} {...pictures} text="Setiap gambar punya nilai. Jumlahkan gambarnya." onDone={finish} />}
      {id === "coding-warna" && <CodeStep key={key} {...colors} text="Setiap warna punya angka. Jumlahkan warnanya." onDone={finish} />}
      {id === "apel" && <AppleCode key={key + gi} group={group} onDone={finish} />}
      {id === "lingkari" && <CircleSame key={key + gi} group={CONFUSABLE_GROUPS[gi % CONFUSABLE_GROUPS.length]} onDone={finish} />}
      {id === "abjad-besar" && <AlphabetFill key={key} upper onDone={finish} />}
      {id === "abjad-kecil" && <AlphabetFill key={key} upper={false} onDone={finish} />}
      {id === "tabel" && <SyllableTable key={key} onDone={finish} />}
      {id === "dengar" && <SyllableListen key={key} onDone={finish} />}
      {win && (
        <Celebration
          stars={win.stars}
          sticker="🏆"
          message="Hebat! Latihan selesai!"
          onClose={() => { setWin(null); setId(null); }}
        />
      )}
    </KidPage>
  );
}
