// Text-to-speech using the device's built-in voices (works offline, no ads, no cost).
export type SpeakOptions = {
  lang?: "id-ID" | "en-US";
  rate?: number;
  onWord?: (wordIndex: number) => void;
  onEnd?: () => void;
};

let voicesCache: SpeechSynthesisVoice[] = [];

function pickVoice(lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return undefined;
  if (!voicesCache.length) voicesCache = window.speechSynthesis.getVoices();
  const base = lang.slice(0, 2);
  return (
    voicesCache.find((v) => v.lang === lang && /female|wanita|google/i.test(v.name)) ??
    voicesCache.find((v) => v.lang === lang) ??
    voicesCache.find((v) => v.lang.startsWith(base))
  );
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
}

let fallbackTimer: ReturnType<typeof setInterval> | undefined;

export function stopSpeaking() {
  if (fallbackTimer) clearInterval(fallbackTimer);
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

export function speak(text: string, opts: SpeakOptions = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    opts.onEnd?.();
    return;
  }
  // Emoji tidak ikut dibacakan (suara mesin bisa menyebut nama emoji).
  text = text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s{2,}/g, " ").trim();
  if (!text) {
    opts.onEnd?.();
    return;
  }
  stopSpeaking();
  const lang = opts.lang ?? "id-ID";
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = opts.rate ?? (lang === "en-US" ? 0.85 : 0.9);
  u.pitch = 1.05;
  const v = pickVoice(lang);
  if (v) u.voice = v;

  // Word offsets, for karaoke highlight
  const starts: number[] = [];
  text.replace(/\S+/g, (m, idx: number) => {
    starts.push(idx);
    return m;
  });
  let gotBoundary = false;
  let current = -1;
  const emit = (i: number) => {
    if (i !== current && i < starts.length) {
      current = i;
      opts.onWord?.(i);
    }
  };
  u.onboundary = (e) => {
    if (e.name && e.name !== "word") return;
    gotBoundary = true;
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= e.charIndex) i++;
    emit(i);
  };
  u.onstart = () => {
    emit(0);
    if (!opts.onWord) return;
    // Some voices don't report word boundaries: estimate timing instead.
    setTimeout(() => {
      if (gotBoundary) return;
      const msPerWord = 430 / (u.rate || 1);
      fallbackTimer = setInterval(() => emit(current + 1), msPerWord);
    }, 500);
  };
  u.onend = () => {
    if (fallbackTimer) clearInterval(fallbackTimer);
    opts.onWord?.(-1);
    opts.onEnd?.();
  };
  u.onerror = u.onend as never;
  window.speechSynthesis.speak(u);
}

export function speakAsync(text: string, opts: Omit<SpeakOptions, "onEnd"> = {}) {
  return new Promise<void>((resolve) => speak(text, { ...opts, onEnd: resolve }));
}
