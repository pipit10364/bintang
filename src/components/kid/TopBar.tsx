import { Link } from "@tanstack/react-router";
import { useProfile } from "@/lib/store";

export function TopBar({ title }: { title?: string }) {
  const { profile } = useProfile();
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <Link
        to="/"
        aria-label="Kembali ke rumah"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-peach text-4xl shadow-[0_5px_0_var(--border)] active:translate-y-1 active:shadow-none"
      >
        🏠
      </Link>
      {title && <h1 className="truncate text-2xl text-foreground md:text-3xl">{title}</h1>}
      <div className="flex items-center gap-2 rounded-full bg-butter px-5 py-3 font-display text-2xl">
        ⭐ {profile.stars}
      </div>
    </div>
  );
}

export function KidPage({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pb-10">
      <TopBar title={title} />
      {children}
    </div>
  );
}
