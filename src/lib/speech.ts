// Suara: memakai rekaman ayah/ibu kalau ada, kalau tidak memakai suara bawaan perangkat
// (offline, tanpa iklan, tanpa biaya).
import { cleanSpeechText, getClip, type ClipInfo } from "./recordings";

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
let currentAudio: HTMLAudioElement | null = null;
let currentFinish: (() => void) | null = null;

function stopAudio() {
  if (!currentAudio) return;
  const finish = currentFinish;
  currentAudio.pause();
  currentAudio = null;
  currentFinish = null;
  // Sama seperti suara mesin yang dibatalkan: onEnd tetap dipanggil, tapi tidak serentak.
  if (finish) setTimeout(finish, 0);
}

export function stopSpeaking() {
  if (fallbackTimer) clearInterval(fallbackTimer);
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  stopAudio();
}

/** Putar rekaman suara ayah/ibu, dengan sorotan kata (perkiraan menurut panjang kata). */
function playClip(text: string, clip: ClipInfo, opts: SpeakOptions) {
  stopSpeaking();
  const audio = new Audio(clip.url);
  currentAudio = audio;

  const words = text.match(/\S+/g) ?? [];
  const total = words.reduce((n, w) => n + w.length + 1, 0) || 1;
  let acc = 0;
  const ends = words.map((w) => (acc += w.length + 1) / total);

  let timer: ReturnType<typeof setInterval> | undefined;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (timer) clearInterval(timer);
    if (currentAudio === audio) {
      currentAudio = null;
      currentFinish = null;
    }
    opts.onWord?.(-1);
    opts.onEnd?.();
  };
  currentFinish = finish;

  audio.onended = finish;
  audio.onerror = finish;
  audio.onplaying = () => {
    if (!opts.onWord || !words.length) return;
    let cur = -1;
    timer = setInterval(() => {
      const f = clip.ms > 0 ? Math.min((audio.currentTime * 1000) / clip.ms, 1) : 0;
      let i = ends.findIndex((e) => f < e);
      if (i < 0) i = words.length - 1;
      if (i !== cur) {
        cur = i;
        opts.onWord?.(i);
      }
    }, 80);
  };
  audio.play().catch(finish);
}

export function speak(text: string, opts: SpeakOptions = {}) {
  if (typeof window === "undefined") {
    opts.onEnd?.();
    return;
  }
  // Emoji tidak ikut dibacakan (suara mesin bisa menyebut nama emoji).
  text = cleanSpeechText(text);
  if (!text) {
    opts.onEnd?.();
    return;
  }
  const clip = getClip(text);
  if (clip) {
    playClip(text, clip, opts);
    return;
  }
  if (!window.speechSynthesis) {
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
