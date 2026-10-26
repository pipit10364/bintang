import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { KidPage } from "@/components/kid/TopBar";
import { THEMES } from "@/data/english";
import { useProfile } from "@/lib/store";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inggris")({
  head: () => ({
    meta: [
      { title: "Belajar Bahasa Inggris | Belajar Ceria" },
      {
        name: "description",
        content: "Kosakata bahasa Inggris per tema: angka, warna, buah, sayur, hewan, dan lainnya.",
      },
    ],
  }),
  component: EnglishLayout,
});

function EnglishLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/inggris/$theme");
  return isChild ? <Outlet /> : <EnglishHome />;
}

function EnglishHome() {
  const { profile } = useProfile();
  const done = profile.enThemes;
  const hard = profile.enHard.length;
  return (
    <KidPage title="Bahasa Inggris">
      <p className="mb-4 text-center font-display text-lg text-muted-foreground">
        Pilih tema. Tiap tema punya lima tantangan yang makin sulit.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map((t) => (
          <Link
            key={t.id}
            to="/inggris/$theme"
            params={{ theme: t.id }}
            onClick={() => speak(t.title, { lang: "en-US" })}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-3xl p-4 text-center shadow-[0_6px_0_var(--border)] active:translate-y-1 active:shadow-none",
              t.color,
            )}
          >
            <span className="text-5xl">{t.emoji}</span>
            <span className="font-display text-xl leading-tight">{t.title}</span>
            <span className="text-xs text-muted-foreground">{t.words.length} kata</span>
            {done.includes(t.id) && <span className="absolute -right-1 -top-2 text-3xl">⭐</span>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/inggris/$theme"
          params={{ theme: "campur" }}
          className={cn(
            "rounded-3xl bg-lilac p-4 text-center shadow-[0_6px_0_var(--border)]",
            done.length === 0 && "pointer-events-none opacity-40",
          )}
          aria-disabled={done.length === 0}
        >
          <div className="text-4xl">🏆</div>
          <div className="font-display text-xl">Tantangan Campuran</div>
          <div className="text-sm text-muted-foreground">
            {done.length === 0
              ? "Selesaikan satu tema dulu"
              : "Kata dari semua tema yang sudah selesai"}
          </div>
        </Link>
        <Link
          to="/inggris/$theme"
          params={{ theme: "sulit" }}
          className={cn(
            "rounded-3xl bg-rose p-4 text-center shadow-[0_6px_0_var(--border)]",
            hard === 0 && "pointer-events-none opacity-40",
          )}
          aria-disabled={hard === 0}
        >
          <div className="text-4xl">💪</div>
          <div className="font-display text-xl">Kata yang Masih Sulit</div>
          <div className="text-sm text-muted-foreground">
            {hard === 0 ? "Belum ada kata sulit" : `${hard} kata untuk diulang`}
          </div>
        </Link>
      </div>
    </KidPage>
  );
}
