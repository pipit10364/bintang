import { Link } from "@tanstack/react-router";
import { useProfile } from "@/lib/store";

export function TopBar({ title }: { title?: string }) {
  const { profile } = useProfile();
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
      <Link
        to="/"
        aria-label="Kembali ke rumah"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-peach text-4xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none"
      >
        🏠
      </Link>
      {title ? <h1 className="truncate text-center text-2xl text-foreground md:text-3xl">{title}</h1> : <span />}
      <div className="flex shrink-0 items-center gap-2 rounded-full bg-butter px-4 py-2 font-display text-xl sm:px-5 sm:py-3 sm:text-2xl">
        ⭐ {profile.stars}
      </div>
    </div>
  );
}

export function KidPage({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pb-safe pt-safe">
      <TopBar title={title} />
      {children}
    </div>
  );
}
