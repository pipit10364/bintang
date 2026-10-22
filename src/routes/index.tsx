import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Drawer } from "vaul";
import { LETTERS } from "@/data/letters";
import { DIGITS, ID_WORDS, keycap } from "@/data/numbers";
import { useProfile } from "@/lib/store";
import { speak } from "@/lib/speech";
import { SpeakerButton } from "@/components/kid/Speaker";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Belajar Ceria — Belajar A sampai Z untuk Anak Siap SD" },
      {
        name: "description",
        content:
          "Aplikasi belajar membaca, menulis, berhitung, dan bahasa Inggris dengan suara, tanpa iklan.",
      },
      { property: "og:title", content: "Belajar Ceria — A sampai Z" },
      {
        property: "og:description",
        content: "Belajar membaca, menulis, berhitung, dan bahasa Inggris dengan suara, tanpa iklan.",
      },
    ],
  }),
  component: Home,
});

type NextStep =
  | { kind: "letter"; letter: string; word: string; emoji: string }
  | { kind: "number"; digit: number }
  | { kind: "done" };

/** Rekomendasi belajar berikutnya: huruf pertama yang belum selesai, lalu angka. */
function useNextStep(): NextStep {
  const { profile } = useProfile();
  const nextLetter = LETTERS.find((l) => !profile.stickers.includes(l.letter));
  const nextNumber = DIGITS.find((d) => !profile.numbers.includes(d));
  if (nextLetter) {
    const w = nextLetter.words[0];
    return w ? { kind: "letter", letter: nextLetter.letter, word: w.id, emoji: w.emoji } : { kind: "done" };
  }
  if (nextNumber !== undefined) return { kind: "number", digit: nextNumber };
  return { kind: "done" };
}

function StartScreen({ onStart, name }: { onStart: () => void; name: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-6 pb-safe text-center">
      <img src={mascot} alt="Maskot Burung Hantu Belajar Ceria" width={220} height={220} className="animate-float rounded-[3rem]" />
      <h1 className="text-5xl font-bold text-foreground md:text-6xl">Belajar Ceria</h1>
      <p className="text-lg text-muted-foreground">
        Petualangan belajar{name ? ` bersama ${name}` : ""}: membaca, menulis, berhitung, dan bahasa Inggris.
      </p>
      <button
        onClick={onStart}
        className="h-24 w-72 rounded-full bg-success font-display text-4xl text-primary-foreground shadow-[0_8px_0_var(--border)] active:translate-y-1 active:shadow-none"
      >
        ▶ Ayo Mulai
      </button>
      <Link to="/orangtua" className="text-sm text-muted-foreground underline">
        Portal Orang Tua
      </Link>
    </div>
  );
}

function Home() {
  const { profile } = useProfile();
  const next = useNextStep();
  const [started, setStarted] = useState(false);
  const [menu, setMenu] = useState(false);
  const name = profile.childName.trim();
  const hello = `Halo${name ? " " + name : ""}! Ayo belajar. Ketuk tombol menu kalau ingin pilih sendiri ya.`;
  const lettersDone = profile.stickers.length;
  const numbersDone = profile.numbers.length;

  const start = () => {
    setStarted(true);
    speak(hello);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  if (!started) return <StartScreen onStart={start} name={name} />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-safe pt-safe sm:max-w-2xl">
      {/* Bilah atas: sapaan + bintang + menu */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img src={mascot} alt="" width={56} height={56} className="shrink-0 rounded-full bg-card" />
          <h1 className="truncate text-2xl text-foreground sm:text-3xl">
            Halo{name ? `, ${name}` : ""}! 👋
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-full bg-butter px-4 py-2 font-display text-xl sm:px-5 sm:py-3 sm:text-2xl">
            ⭐ {profile.stars}
          </div>
          <button
            onClick={() => {
              setMenu(true);
              speak("Kelas dan peta belajar");
            }}
            aria-label="Buka menu kelas dan peta"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-peach text-2xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Maskot menyapa */}
      <div className="flex items-center gap-4 rounded-[2rem] bg-card p-4">
        <img src={mascot} alt="Maskot" width={96} height={96} loading="lazy" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg break-words text-foreground sm:text-xl">
            {name ? `Hai ${name}!` : "Hai teman!"} Siap berpetualang belajar hari ini?
          </p>
          <div className="mt-2">
            <SpeakerButton text={hello} size="md" />
          </div>
        </div>
      </div>

      {/* Satu rekomendasi belajar hari ini */}
      <div className="mt-4 rounded-[2rem] bg-mint/60 p-5 text-center sm:p-6">
        <p className="font-display text-lg text-muted-foreground">✨ Petualangan Hari Ini</p>
        {next.kind === "letter" && (
          <>
            <div className="mt-2 font-display text-7xl text-foreground sm:text-8xl">{next.letter}</div>
            <div className="mt-1 text-4xl">{next.emoji}</div>
            <p className="mt-2 font-display text-xl text-foreground">
              Ayo belajar huruf {next.letter}, seperti pada kata <b>{next.word}</b>!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {lettersDone}/26 huruf · {numbersDone}/10 angka selesai
            </p>
            <Link
              to="/huruf/$letter"
              params={{ letter: next.letter }}
              onClick={() => speak(`Petualangan huruf ${next.letter}!`)}
              className="mt-4 block h-16 rounded-full bg-success font-display text-2xl leading-[4rem] text-primary-foreground shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none sm:text-3xl"
            >
              Lanjutkan ▶
            </Link>
          </>
        )}
        {next.kind === "number" && (
          <>
            <div className="mt-2 font-display text-7xl text-foreground sm:text-8xl">{next.digit}</div>
            <p className="mt-2 font-display text-xl text-foreground">Ayo belajar angka {ID_WORDS[next.digit]}!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {lettersDone}/26 huruf · {numbersDone}/10 angka selesai
            </p>
            <Link
              to="/angka/$digit"
              params={{ digit: String(next.digit) }}
              onClick={() => speak(`Petualangan angka ${ID_WORDS[next.digit]}!`)}
              className="mt-4 block h-16 rounded-full bg-success font-display text-2xl leading-[4rem] text-primary-foreground shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none sm:text-3xl"
            >
              Lanjutkan ▶
            </Link>
          </>
        )}
        {next.kind === "done" && (
          <>
            <div className="mt-2 text-6xl">🏆</div>
            <p className="mt-2 font-display text-xl text-foreground">
              Luar biasa! Semua huruf dan angka sudah selesai. Ulangi favoritmu lewat menu!
            </p>
          </>
        )}
      </div>

      {/* Menu kelas & peta */}
      <Drawer.Root open={menu} onOpenChange={setMenu}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-foreground/30" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[88dvh] max-w-2xl flex-col rounded-t-[2rem] bg-card outline-none">
            <div className="shrink-0 px-5 pt-4">
              <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-border" />
              <Drawer.Title className="text-center font-display text-2xl">🧭 Kelas & Peta Belajar</Drawer.Title>
            </div>
            {/* Area gulir dipisah dari panel drawer supaya isi di bawah tidak ikut terpotong */}
            <div data-vaul-no-drag className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe pt-4">
              <MenuContent />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

function MenuContent() {
  const { profile } = useProfile();
  const TILE = ["bg-peach", "bg-mint", "bg-sky", "bg-lilac", "bg-butter", "bg-rose"];
  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 font-display text-xl">🔤 Peta Abjad</h2>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 sm:gap-3">
          {LETTERS.map((l, i) => {
            const done = profile.stickers.includes(l.letter);
            return (
              <Link
                key={l.letter}
                to="/huruf/$letter"
                params={{ letter: l.letter }}
                onClick={() => speak(`Huruf ${l.letter}`)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-2xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none",
                  TILE[i % TILE.length],
                )}
              >
                <span className="font-display text-3xl text-foreground sm:text-4xl">{l.letter}</span>
                <span className="text-lg sm:text-xl">{done ? "⭐" : l.words[0].emoji}</span>
              </Link>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl">🔢 Belajar Angka</h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {DIGITS.map((d, i) => (
            <Link
              key={d}
              to="/angka/$digit"
              params={{ digit: String(d) }}
              onClick={() => speak(`Angka ${ID_WORDS[d]}`)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-2xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none",
                TILE[(i + 2) % TILE.length],
              )}
            >
              <span className="font-display text-3xl text-foreground sm:text-4xl">{d}</span>
              {profile.numbers.includes(d) && (
                <span className="absolute -top-1 -right-1 text-lg">⭐</span>
              )}
            </Link>
          ))}
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/kembar"
          onClick={() => speak("Huruf kembar")}
          className="rounded-2xl bg-lilac p-4 text-center shadow-[0_5px_0_var(--border)]"
        >
          <div className="font-display text-2xl tracking-[0.2em]">bdpq</div>
          <div className="mt-1 font-display text-base sm:text-lg">Huruf Kembar</div>
        </Link>
        <Link
          to="/keluarga"
          onClick={() => speak("Namaku dan keluargaku")}
          className="rounded-2xl bg-mint p-4 text-center shadow-[0_5px_0_var(--border)]"
        >
          <div className="text-3xl">👨‍👩‍👧</div>
          <div className="mt-1 font-display text-base sm:text-lg">Namaku & Keluarga</div>
        </Link>
        <Link
          to="/cerita"
          onClick={() => speak("Rak buku cerita")}
          className="col-span-2 rounded-2xl bg-sky p-4 text-center shadow-[0_5px_0_var(--border)]"
        >
          <div className="text-3xl">📚</div>
          <div className="mt-1 font-display text-base sm:text-lg">Buku Cerita</div>
        </Link>
      </section>
      {(profile.stickers.length > 0 || profile.numbers.length > 0) && (
        <section className="rounded-2xl bg-muted/60 p-4">
          <h2 className="font-display text-lg">🏅 Buku Stikerku</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-4xl">
            {profile.stickers.map((s) => (
              <span key={s} title={s}>
                {LETTERS.find((l) => l.letter === s)?.words[0].emoji}
              </span>
            ))}
            {profile.numbers.map((n) => (
              <span key={`n${n}`} title={`Angka ${n}`}>
                {keycap(n)}
              </span>
            ))}
          </div>
        </section>
      )}
      <div className="text-center">
        <Link to="/orangtua" className="text-sm text-muted-foreground underline">
          Portal Orang Tua
        </Link>
      </div>
    </div>
  );
}
