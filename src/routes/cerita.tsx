import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { STORIES, type StoryPage } from "@/data/stories";
import { addStars, useProfile } from "@/lib/store";
import { speak } from "@/lib/speech";
import { KidPage } from "@/components/kid/TopBar";
import { StoryReader } from "@/components/kid/Story";
import { Celebration } from "@/components/kid/Celebration";
import { Instruction } from "@/components/kid/Speaker";

export const Route = createFileRoute("/cerita")({
  head: () => ({
    meta: [
      { title: "Rak Buku Cerita — Belajar Ceria" },
      { name: "description", content: "Buku cerita interaktif bersuara: fabel, sains, siaga bencana, pengetahuan umum, dan hikmah." },
      { property: "og:title", content: "Rak Buku Cerita — Belajar Ceria" },
      { property: "og:description", content: "Cerita bersuara dengan aktivitas sentuh dan tarik." },
    ],
  }),
  component: Shelf,
});

type Book = { id: string; title: string; emoji: string; topic: string; pages: StoryPage[] };

function Shelf() {
  const { profile } = useProfile();
  const books: Book[] = [
    ...STORIES,
    ...profile.stories.map((s) => ({
      id: s.id,
      title: s.title,
      emoji: s.emoji || "💖",
      topic: "Cerita dari Ayah Ibu",
      pages: s.pages.map((text) => ({ scene: s.emoji || "💖", text })),
    })),
  ];
  const [open, setOpen] = useState<Book | null>(null);
  const [win, setWin] = useState(false);

  if (open)
    return (
      <KidPage>
        <StoryReader title={open.title} pages={open.pages} onDone={() => { addStars(2); setWin(true); }} />
        {win && <Celebration stars={2} message="Hore! Ceritanya selesai!" onClose={() => { setWin(false); setOpen(null); }} />}
      </KidPage>
    );

  return (
    <KidPage title="Buku Cerita">
      <Instruction text="Pilih buku cerita yang kamu suka!" />
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        {books.map((b, i) => (
          <button key={b.id} onClick={() => { speak(b.title); setOpen(b); }}
            className={`rounded-3xl p-5 text-center shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none ${["bg-peach", "bg-mint", "bg-sky", "bg-lilac", "bg-butter", "bg-rose"][i % 6]}`}>
            <div className="text-6xl">{b.emoji}</div>
            <div className="mt-2 font-display text-xl leading-tight">{b.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{b.topic}</div>
          </button>
        ))}
      </div>
    </KidPage>
  );
}
