import { Link, useRouter } from "@tanstack/react-router";
import { useProfile } from "@/lib/store";

/** `onBack`: langkah mundur di dalam halaman (misalnya dari daftar level ke menu). Tanpa itu: halaman sebelumnya. */
export function TopBar({ title, onBack }: { title?: string; onBack?: () => void }) {
  const { profile } = useProfile();
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
    else router.navigate({ to: "/" });
  };
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-3 sm:gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          aria-label="Kembali"
          data-testid="back"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky text-3xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none sm:h-16 sm:w-16 sm:text-4xl"
        >
          ⬅️
        </button>
        <Link
          to="/"
          aria-label="Ke menu utama"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-peach text-3xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none sm:h-16 sm:w-16 sm:text-4xl"
        >
          🏠
        </Link>
      </div>
      {title ? <h1 className="truncate text-center text-xl text-foreground sm:text-2xl md:text-3xl">{title}</h1> : <span />}
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-butter px-3 py-2 font-display text-lg sm:gap-2 sm:px-5 sm:py-3 sm:text-2xl">
        ⭐ {profile.stars}
      </div>
    </div>
  );
}

export function KidPage({ children, title, onBack }: { children: React.ReactNode; title?: string; onBack?: () => void }) {
  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pb-safe pt-safe">
      <TopBar title={title} onBack={onBack} />
      {children}
    </div>
  );
}
