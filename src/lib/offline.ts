// Mode offline: mendaftarkan service worker (public/sw.js) dan meminta semua halaman
// pelajaran diunduh saat ada internet, supaya aplikasi bisa dipakai tanpa internet.
import { useCallback, useEffect, useState } from "react";
import { LETTERS } from "@/data/letters";
import { DIGITS } from "@/data/numbers";
import { THEMES } from "@/data/english";

const WARM_KEY = "bintang-offline-warmed";
const WARM_EVERY_MS = 6 * 3600 * 1000;

/** Semua alamat halaman yang perlu tersimpan. */
export function offlineUrls(): string[] {
  return [
    "/",
    "/orangtua",
    "/bentuk",
    "/inggris",
    "/kembar",
    "/keluarga",
    "/cerita",
    ...LETTERS.map((l) => `/huruf/${l.letter}`),
    ...DIGITS.map((d) => `/angka/${d}`),
    ...THEMES.map((t) => `/inggris/${t.id}`),
    "/inggris/campur",
    "/inggris/sulit",
  ];
}

const supported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "caches" in window && import.meta.env.PROD;

const readStamp = () => {
  try {
    return JSON.parse(localStorage.getItem(WARM_KEY) || "null") as { at: number; pages: number; files: number } | null;
  } catch {
    return null;
  }
};

async function askWarm() {
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({ type: "warm", urls: offlineUrls() });
}

/** Panggil sekali saat aplikasi dibuka. Hanya jalan di versi yang sudah di-build (bukan npm run dev). */
export function registerOffline() {
  if (!supported()) return;
  const go = async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      const stamp = readStamp();
      if (navigator.onLine && (!stamp || Date.now() - stamp.at > WARM_EVERY_MS)) await askWarm();
    } catch {
      /* tanpa service worker aplikasi tetap jalan seperti biasa */
    }
  };
  if (document.readyState === "complete") void go();
  else window.addEventListener("load", () => void go(), { once: true });
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type === "warmed") {
      try {
        localStorage.setItem(WARM_KEY, JSON.stringify({ at: Date.now(), pages: e.data.pages, files: e.data.files }));
      } catch {
        /* abaikan */
      }
      window.dispatchEvent(new Event("bintang-offline"));
    }
  });
}

export type OfflineState =
  | { kind: "unsupported" }
  | { kind: "waiting" }
  | { kind: "busy" }
  | { kind: "ready"; pages: number; at: number };

/** Status untuk layar orang tua. */
export function useOfflineStatus() {
  const [state, setState] = useState<OfflineState>({ kind: "waiting" });
  const refresh = useCallback(() => {
    if (!supported()) return setState({ kind: "unsupported" });
    const s = readStamp();
    setState(s && s.pages > 0 ? { kind: "ready", pages: s.pages, at: s.at } : { kind: "waiting" });
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener("bintang-offline", refresh);
    return () => window.removeEventListener("bintang-offline", refresh);
  }, [refresh]);
  const download = useCallback(async () => {
    if (!supported() || !navigator.onLine) return;
    setState({ kind: "busy" });
    try {
      await askWarm();
    } catch {
      refresh();
    }
  }, [refresh]);
  return { state, download };
}
