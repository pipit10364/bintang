// Kemajuan level "Latihan Seru" disimpan di perangkat (localStorage), terpisah dari profil.
import { useCallback, useEffect, useState } from "react";
import { LEVELS } from "./latihan";

const KEY = "belajar-ceria-latihan-v1";
/** tema -> level -> bintang terbaik (1 sampai 3) */
export type LatihanProgress = Record<string, Record<number, number>>;

export function loadLatihan(): LatihanProgress {
  try {
    const raw = localStorage.getItem(KEY);
    const p = raw ? JSON.parse(raw) : {};
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

/** Simpan hasil level (bintang terbaik dipertahankan). Mengembalikan tambahan bintang dibanding sebelumnya. */
export function recordLevel(theme: string, level: number, stars: number): { next: LatihanProgress; gained: number } {
  const cur = loadLatihan();
  const old = cur[theme]?.[level] ?? 0;
  const best = Math.max(old, stars);
  const next = { ...cur, [theme]: { ...(cur[theme] ?? {}), [level]: best } };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* penyimpanan penuh atau diblokir: abaikan */
  }
  return { next, gained: best - old };
}

/** Level tertinggi yang terbuka: level pertama selalu terbuka, berikutnya terbuka setelah level sebelumnya selesai. */
export function unlockedLevel(p: LatihanProgress, theme: string): number {
  let n = 1;
  while (n < LEVELS && p[theme]?.[n]) n++;
  return n;
}

export function useLatihanProgress() {
  const [progress, setProgress] = useState<LatihanProgress>({});
  useEffect(() => setProgress(loadLatihan()), []);
  const record = useCallback((theme: string, level: number, stars: number) => {
    const r = recordLevel(theme, level, stars);
    setProgress(r.next);
    return r.gained;
  }, []);
  return { progress, record };
}
