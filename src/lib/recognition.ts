// Pengenalan suara (anak membaca keras). Memakai Web Speech API bawaan peramban:
// ada di Chrome dan Edge (termasuk Android), tidak ada di semua peramban.
//
// Penting: peramban TIDAK memberi tahu "mikrofon rusak" atau "tidak ada internet" secara
// terpisah dari "tidak ada suara". Karena itu hasilnya dibedakan menjadi beberapa jenis
// error, dan ada tiga penanda tahap (mikrofon menyala, suara terdeteksi, teks terbaca)
// supaya anak, orang tua, dan layar tes mikrofon bisa melihat di tahap mana yang macet.

type Alt = { transcript: string };
type Rec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<Alt>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
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

export type ListenError =
  | "unsupported" // peramban tidak punya pengenalan suara
  | "not-allowed" // izin mikrofon ditolak
  | "no-mic" // mikrofon tidak ditemukan / dipakai aplikasi lain
  | "no-audio" // pengenalan dimulai tetapi mikrofon tidak pernah menyala
  | "network" // layanan pengenalan suara tidak terjangkau (butuh internet)
  | "no-speech" // mikrofon menyala tetapi tidak ada suara
  | "start-failed"
  | "aborted"
  | "error";

export type ListenResult = {
  heard: string[];
  error?: ListenError;
  /** Mikrofon benar-benar menyala. */
  micOpened: boolean;
  /** Peramban mendeteksi ada orang bicara. */
  speechDetected: boolean;
  /** Berhenti lebih awal karena ucapan sudah cocok. */
  matched: boolean;
};

export type ListenOptions = {
  /** Dipanggil saat tahap berganti: mikrofon menyala, lalu suara terdeteksi. */
  onPhase?: (p: "mic" | "speech") => void;
  /** Teks sementara selagi anak masih berbicara. */
  onInterim?: (text: string) => void;
  /** Kalau ucapan sementara sudah cocok, berhenti mendengar dan langsung selesai. */
  isMatch?: (heard: string[]) => boolean;
  /** Batas waktu mendengar. */
  maxMs?: number;
};

const mapError = (e?: string): ListenError => {
  switch (e) {
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "audio-capture":
      return "no-mic";
    case "network":
      return "network";
    case "no-speech":
      return "no-speech";
    case "aborted":
      return "aborted";
    default:
      return "error";
  }
};

/** Kesalahan teknis (bukan salah bacanya anak): tidak boleh dihitung sebagai jawaban salah. */
export const isTechnicalError = (e?: ListenError) =>
  e === "unsupported" ||
  e === "not-allowed" ||
  e === "no-mic" ||
  e === "no-audio" ||
  e === "network" ||
  e === "start-failed" ||
  e === "error";

/**
 * Dengarkan satu ucapan. Mengembalikan beberapa kemungkinan teks, urut dari yang terbaru.
 * Hasil sementara ikut dipakai: begitu cocok, langsung berhenti, jadi anak tidak perlu
 * menunggu jeda sunyi sebelum dinilai.
 */
export function listenOnce(lang: "id-ID" | "en-US", opts: ListenOptions = {}): Promise<ListenResult> {
  return new Promise((resolve) => {
    const C = ctor();
    const base = { heard: [] as string[], micOpened: false, speechDetected: false, matched: false };
    if (!C) return resolve({ ...base, error: "unsupported" });
    stopListening();
    const r = new C();
    active = r;
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 5;

    const seen: string[] = []; // semua kemungkinan teks, yang terbaru di depan
    let micOpened = false;
    let speechDetected = false;
    let matched = false;
    let error: ListenError | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      if (active === r) active = null;
      // Mikrofon tidak pernah menyala dan tidak ada error: peramban diam-diam menolak.
      if (!error && !seen.length && !micOpened) error = "no-audio";
      // Ada teks yang dikenali: error "tidak ada suara" tidak relevan lagi.
      if (seen.length && (error === "no-speech" || error === "aborted")) error = undefined;
      resolve({ heard: seen, error, micOpened, speechDetected, matched });
    };

    r.onaudiostart = () => {
      micOpened = true;
      opts.onPhase?.("mic");
    };
    r.onspeechstart = () => {
      speechDetected = true;
      opts.onPhase?.("speech");
    };
    r.onresult = (e) => {
      speechDetected = true;
      const res = e.results[e.results.length - 1];
      if (!res) return;
      const alts = Array.from({ length: res.length }, (_, i) => res[i].transcript).filter(Boolean);
      for (const a of [...alts].reverse()) {
        const at = seen.indexOf(a);
        if (at >= 0) seen.splice(at, 1);
        seen.unshift(a);
      }
      if (alts[0]) opts.onInterim?.(alts[0]);
      if (!matched && opts.isMatch?.(seen)) {
        matched = true;
        try {
          r.stop();
        } catch {
          /* abaikan */
        }
        // Beberapa peramban terlambat memanggil onend setelah stop(); jangan menunggu.
        setTimeout(finish, 400);
      }
    };
    r.onerror = (e) => {
      error = mapError(e.error);
    };
    r.onend = finish;

    try {
      r.start();
      timer = setTimeout(() => {
        try {
          r.stop();
        } catch {
          /* abaikan */
        }
        setTimeout(finish, 1500);
      }, opts.maxMs ?? 9000);
    } catch {
      error = "start-failed";
      finish();
    }
  });
}

/** Penjelasan untuk anak (pendek, tanpa istilah teknis). */
export const kidMessage: Record<ListenError, string> = {
  unsupported: "Perangkat ini belum bisa mendengar bacaan.",
  "not-allowed": "Izinkan mikrofon dulu di peramban ya, lalu ketuk lagi.",
  "no-mic": "Mikrofonnya belum bisa dipakai. Minta bantuan orang tua ya.",
  "no-audio": "Mikrofonnya belum menyala. Ketuk lagi ya.",
  network: "Aku butuh internet untuk mendengar. Minta bantuan orang tua ya.",
  "no-speech": "Suaranya belum terdengar. Dekatkan ke mikrofon dan baca lebih keras ya.",
  "start-failed": "Mikrofonnya belum siap. Ketuk lagi ya.",
  aborted: "Ketuk mikrofon lagi ya.",
  error: "Ada yang belum beres dengan mikrofon. Ketuk lagi ya.",
};

/** Penjelasan untuk orang tua (di layar tes mikrofon). */
export const parentMessage: Record<ListenError, string> = {
  unsupported:
    "Peramban ini tidak punya fitur pengenalan suara. Pakai Chrome atau Edge. Di iPhone, buka lewat Safari (bukan dari ikon layar utama).",
  "not-allowed":
    "Izin mikrofon ditolak. Buka pengaturan situs di peramban (ikon gembok di sebelah alamat), lalu izinkan Mikrofon. Kalau aplikasi dipasang di layar utama, cek juga izin mikrofon di pengaturan perangkat.",
  "no-mic": "Mikrofon tidak ditemukan atau sedang dipakai aplikasi lain (panggilan, rekaman layar). Tutup aplikasi itu lalu coba lagi.",
  "no-audio":
    "Pengenalan suara mulai, tetapi mikrofon tidak pernah menyala. Biasanya karena aplikasi dibuka dari ikon layar utama atau di dalam aplikasi lain (WhatsApp, Instagram). Coba buka langsung di Chrome atau Safari.",
  network:
    "Pengenalan suara di Chrome memakai server Google, jadi perangkat harus online. Cek internet, atau matikan mode hemat data / VPN lalu coba lagi.",
  "no-speech": "Mikrofon menyala tetapi tidak mendengar suara. Dekatkan perangkat ke mulut dan bicara agak keras.",
  "start-failed": "Pengenalan suara gagal dimulai. Muat ulang halaman lalu coba lagi.",
  aborted: "Pendengaran dibatalkan. Coba lagi.",
  error: "Terjadi kesalahan yang tidak dikenal pada pengenalan suara. Muat ulang halaman lalu coba lagi.",
};

/** Perkiraan penyebab dari jenis perangkat, untuk layar orang tua. */
export function environmentHints(): string[] {
  if (typeof window === "undefined") return [];
  const hints: string[] = [];
  const ua = navigator.userAgent;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  const ios = /iPhone|iPad|iPod/.test(ua);
  if (ios && standalone)
    hints.push(
      "Di iPhone/iPad, pengenalan suara sering tidak jalan kalau aplikasi dibuka dari ikon layar utama. Buka lewat Safari.",
    );
  if (ios) hints.push("Di iPhone/iPad, aktifkan Pengaturan > Umum > Papan Ketik > Aktifkan Dikte.");
  if ((navigator as unknown as { brave?: unknown }).brave)
    hints.push("Brave memblokir pengenalan suara. Pakai Chrome.");
  if (/FBAN|FBAV|Instagram|Line\/|WhatsApp|wv\)/i.test(ua))
    hints.push("Aplikasi ini terbuka di dalam aplikasi lain. Buka lewat Chrome atau Safari langsung.");
  if (!window.isSecureContext) hints.push("Halaman harus dibuka lewat https agar mikrofon boleh dipakai.");
  return hints;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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
 * Kata 1 sampai 2 huruf harus persis; kata 3 huruf boleh selisih 1 huruf asal huruf
 * depannya sama; kata pendek hanya dihitung kalau berdiri sebagai kata sendiri
 * (supaya "es" tidak cocok dengan "besar").
 */
export function matchesTarget(heard: string[], target: string) {
  const t = norm(target);
  if (!t) return false;
  const tol = t.length <= 2 ? 0 : t.length <= 6 ? 1 : 2;
  return heard.some((h) => {
    const words = h.toLowerCase().split(/\s+/).map(norm).filter(Boolean);
    const whole = norm(h);
    if (whole === t) return true;
    if (t.length >= 4 && whole.includes(t)) return true;
    if (words.includes(t)) return true;
    if (t.length === 3) return words.some((w) => w[0] === t[0] && w.length >= 2 && lev(w, t) <= 1);
    return [whole, ...words].some((w) => lev(w, t) <= tol);
  });
}
