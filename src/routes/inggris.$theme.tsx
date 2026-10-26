import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ALL_EN_WORDS, findWord, getTheme, THEMES, type EnWord } from "@/data/english";
import { addStars, loadProfile, saveProfile, useProfile } from "@/lib/store";
import { EnglishPlay, type Stage } from "@/components/kid/EnglishPlay";

const SPECIAL = ["campur", "sulit"];

export const Route = createFileRoute("/inggris/$theme")({
  loader: ({ params }) => {
    if (!SPECIAL.includes(params.theme) && !getTheme(params.theme)) throw notFound();
    return { theme: params.theme };
  },
  component: EnglishTheme,
});

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function EnglishTheme() {
  const { theme } = Route.useLoaderData();
  const navigate = useNavigate();
  const { profile, ready } = useProfile();

  const setup = useMemo(() => {
    const p = loadProfile();
    if (theme === "campur") {
      const done = THEMES.filter((t) => p.enThemes.includes(t.id));
      const words = shuffle(done.flatMap((t) => t.words)).slice(0, 12);
      return {
        title: "Tantangan Campuran",
        words,
        pool: done.flatMap((t) => t.words),
        stages: ["dengar", "baca", "ketik", "ucap"] as Stage[],
      };
    }
    if (theme === "sulit") {
      const words = p.enHard
        .map(findWord)
        .filter((x): x is EnWord => Boolean(x))
        .slice(0, 10);
      return {
        title: "Kata yang Masih Sulit",
        words,
        pool: ALL_EN_WORDS,
        stages: ["kenal", "dengar", "baca", "ketik", "ucap"] as Stage[],
      };
    }
    const t = getTheme(theme)!;
    return {
      title: t.title,
      words: t.words,
      pool: t.words,
      stages: ["kenal", "dengar", "baca", "ketik", "ucap"] as Stage[],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, ready]);

  if (!ready) return null;
  if (setup.words.length < 4) {
    return (
      <div className="mx-auto max-w-md p-8 text-center font-display text-2xl">
        Belum ada kata untuk dimainkan.
        <button
          className="mt-6 block w-full rounded-3xl bg-peach p-4"
          onClick={() => navigate({ to: "/inggris" })}
        >
          Kembali
        </button>
      </div>
    );
  }
  void profile;

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-safe pt-safe">
      <div className="flex items-center justify-between gap-3 py-3">
        <button
          onClick={() => navigate({ to: "/inggris" })}
          aria-label="Kembali ke daftar tema"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-peach text-3xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none"
        >
          ⬅️
        </button>
        <h1 className="min-w-0 truncate text-center text-2xl text-foreground">{setup.title}</h1>
        <span className="w-14" />
      </div>
      <EnglishPlay
        words={setup.words}
        pool={setup.pool.length >= 4 ? setup.pool : ALL_EN_WORDS}
        stages={setup.stages}
        onFinish={({ perfect, missed }) => {
          const played = new Set(setup.words.map((w) => w.en));
          saveProfile((p) => {
            const hard = new Set(p.enHard);
            missed.forEach((m) => hard.add(m));
            // Kata yang dimainkan dan tidak pernah salah dianggap sudah dikuasai.
            played.forEach((w) => {
              if (!missed.includes(w)) hard.delete(w);
            });
            return {
              enHard: [...hard],
              enThemes:
                SPECIAL.includes(theme) || p.enThemes.includes(theme)
                  ? p.enThemes
                  : [...p.enThemes, theme],
            };
          });
          addStars(perfect ? 3 : 1);
          navigate({ to: "/inggris" });
        }}
      />
    </div>
  );
}
