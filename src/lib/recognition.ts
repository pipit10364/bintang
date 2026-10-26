// Pengenalan suara (anak membaca keras). Memakai Web Speech API bawaan peramban:
// ada di Chrome dan Edge (termasuk Android), tidak ada di semua peramban.

type Rec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function ctor(): (new () => Rec) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const recognitionSupported = () => Boolean(ctor());

let active: Rec | null = null;

export function stopListening() {
  try {
    active?.abort();
  } catch {
    /* abaikan */
  }
  active = null;
}

export type ListenResult = { heard: string[]; error?: string };

/** Dengarkan satu ucapan. Mengembalikan beberapa kemungkinan teks, urut dari yang paling yakin. */
export function listenOnce(lang: "id-ID" | "en-US"): Promise<ListenResult> {
  return new Promise((resolve) => {
    const C = ctor();
    if (!C) return resolve({ heard: [], error: "unsupported" });
    stopListening();
    const r = new C();
    active = r;
    r.lang = lang;
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 5;
    let heard: string[] = [];
    let error: string | undefined;
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      heard = Array.from({ length: res.length }, (_, i) => res[i].transcript);
    };
    r.onerror = (e) => {
      error = e.error ?? "error";
    };
    r.onend = () => {
      if (active === r) active = null;
      resolve({ heard, error });
    };
    try {
      r.start();
    } catch {
      resolve({ heard: [], error: "start-failed" });
    }
  });
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

function lev(a: string, b: string) {
  const dp = Array.from(
    { length: a.length + 1 },
    (_, i) => [i, ...Array(b.length).fill(0)] as number[],
  );
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[a.length][b.length];
}

/**
 * Cocokkan ucapan anak dengan kata target. Longgar, karena suara anak kecil sering
 * salah dikenali: cukup mirip (selisih 1 huruf untuk kata pendek, 2 untuk kata panjang)
 * atau target terdapat di dalam kalimat yang terdengar.
 */
export function matchesTarget(heard: string[], target: string) {
  const t = norm(target);
  if (!t) return false;
  const tol = t.length <= 3 ? 0 : t.length <= 6 ? 1 : 2;
  return heard.some((h) => {
    const words = h.toLowerCase().split(/\s+/).map(norm).filter(Boolean);
    const whole = norm(h);
    if (whole === t || whole.includes(t)) return true;
    return [whole, ...words].some((w) => lev(w, t) <= tol);
  });
}
