import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LETTERS } from "@/data/letters";
import { DIGITS, ID_WORDS, keycap } from "@/data/numbers";
import { useProfile } from "@/lib/store";
import { speak } from "@/lib/speech";
import { SpeakerButton } from "@/components/kid/Speaker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Belajar Ceria — Belajar A sampai Z untuk Anak Siap SD" },
      { name: "description", content: "Aplikasi belajar membaca, menulis, berhitung, dan bahasa Inggris dengan suara, tanpa iklan." },
      { property: "og:title", content: "Belajar Ceria — A sampai Z" },
      { property: "og:description", content: "Belajar membaca, menulis, berhitung, dan bahasa Inggris dengan suara, tanpa iklan." },
    ],
  }),
  component: Home,
});

const TILE = ["bg-peach", "bg-mint", "bg-sky", "bg-lilac", "bg-butter", "bg-rose"];

function Home() {
  const { profile } = useProfile();
  const [started, setStarted] = useState(false);
  const hello = `Halo${profile.childName ? " " + profile.childName : ""}! Ayo belajar. Pilih satu huruf atau angka ya.`;

  const start = () => {
    setStarted(true);
    speak(hello);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  if (!started)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
        <img src="/icon-512.png" alt="" width={220} height={220} className="animate-float rounded-[3rem]" />
        <h1 className="text-5xl text-foreground md:text-6xl">Belajar Ceria</h1>
        <button
          onClick={start}
          className="h-28 w-72 rounded-full bg-success font-display text-4xl text-primary-foreground shadow-[0_8px_0_var(--border)] active:translate-y-1 active:shadow-none"
        >
          ▶ Ayo Mulai
        </button>
        <Link to="/orangtua" className="mt-6 text-sm text-muted-foreground underline">
          Portal Orang Tua
        </Link>
      </div>
    );

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-12">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <SpeakerButton text={hello} size="md" />
          <h1 className="text-3xl text-foreground md:text-4xl">
            Halo{profile.childName ? `, ${profile.childName}` : ""}! 👋
          </h1>
        </div>
        <div className="rounded-full bg-butter px-5 py-3 font-display text-2xl">⭐ {profile.stars}</div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Link to="/kembar" onClick={() => speak("Huruf kembar")} className="rounded-3xl bg-lilac p-5 text-center shadow-[0_6px_0_var(--border)]">
          <div className="font-display text-5xl">b d p q</div>
          <div className="mt-1 font-display text-xl">Huruf Kembar</div>
        </Link>
        <Link to="/keluarga" onClick={() => speak("Namaku dan keluargaku")} className="rounded-3xl bg-mint p-5 text-center shadow-[0_6px_0_var(--border)]">
          <div className="text-5xl">👨‍👩‍👧</div>
          <div className="mt-1 font-display text-xl">Namaku & Keluarga</div>
        </Link>
        <Link to="/cerita" onClick={() => speak("Rak buku cerita")} className="col-span-2 rounded-3xl bg-sky p-5 text-center shadow-[0_6px_0_var(--border)] md:col-span-1">
          <div className="text-5xl">📚</div>
          <div className="mt-1 font-display text-xl">Buku Cerita</div>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-7">
        {LETTERS.map((l, i) => {
          const done = profile.stickers.includes(l.letter);
          return (
            <Link
              key={l.letter}
              to="/huruf/$letter"
              params={{ letter: l.letter }}
              onClick={() => speak(`Huruf ${l.letter}`)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none",
                TILE[i % TILE.length],
              )}
            >
              <span className="font-display text-5xl text-foreground">{l.letter}</span>
              <span className="text-2xl">{l.words[0].emoji}</span>
              {done && <span className="absolute -right-1 -top-2 text-3xl">⭐</span>}
            </Link>
          );
        })}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-2xl">🔢 Belajar Angka</h2>
        <div className="grid grid-cols-5 gap-3">
          {DIGITS.map((d, i) => (
            <Link
              key={d}
              to="/angka/$digit"
              params={{ digit: String(d) }}
              onClick={() => speak(`Angka ${ID_WORDS[d]}`)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-3xl shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none",
                TILE[(i + 2) % TILE.length],
              )}
            >
              <span className="font-display text-5xl text-foreground">{d}</span>
              {profile.numbers.includes(d) && <span className="absolute -right-1 -top-2 text-2xl">⭐</span>}
            </Link>
          ))}
        </div>
      </section>

      {(profile.stickers.length > 0 || profile.numbers.length > 0) && (
        <section className="mt-8 rounded-3xl bg-card p-5">
          <h2 className="text-2xl">🏅 Buku Stikerku</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-5xl">
            {profile.stickers.map((s) => (
              <span key={s} title={s}>{LETTERS.find((l) => l.letter === s)?.words[0].emoji}</span>
            ))}
            {profile.numbers.map((n) => (
              <span key={`n${n}`} title={`Angka ${n}`}>{keycap(n)}</span>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 text-center">
        <Link to="/orangtua" className="text-sm text-muted-foreground underline">
          Portal Orang Tua
        </Link>
      </div>
    </div>
  );
}
