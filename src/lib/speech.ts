// Suara: memakai rekaman ayah/ibu kalau ada, kalau tidak memakai suara bawaan perangkat
// (offline, tanpa iklan, tanpa biaya).
import { useEffect, useState } from "react";
import { cleanSpeechText, getClip, type ClipInfo } from "./recordings";

export type SpeakOptions = {
  lang?: "id-ID" | "en-US";
  rate?: number;
  onWord?: (wordIndex: number) => void;
  onEnd?: () => void;
};

let voicesCache: SpeechSynthesisVoice[] = [];

/** Kode bahasa suara bisa "id-ID", "id_ID", atau "in-ID" (Android lama memakai "in"). */
const normLang = (l: string) => l.replace("_", "-").toLowerCase();
const baseOf = (l: string) => {
  const b = normLang(l).slice(0, 2);
  return b === "in" ? "id" : b;
};

function loadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  if (!voicesCache.length) voicesCache = window.speechSynthesis.getVoices();
  return voicesCache;
}

function pickVoice(lang: string) {
  const voices = loadVoices();
  const want = normLang(lang);
  const base = baseOf(lang);
  const sameBase = voices.filter((v) => baseOf(v.lang) === base);
  return (
    sameBase.find((v) => normLang(v.lang) === want && /female|wanita|google/i.test(v.name)) ??
    sameBase.find((v) => normLang(v.lang) === want) ??
    sameBase[0]
  );
}

/** Apakah perangkat punya suara untuk bahasa ini? */
export const hasVoiceFor = (lang: "id-ID" | "en-US") => Boolean(pickVoice(lang));

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
    voiceSubs.forEach((f) => f());
  };
}
const voiceSubs = new Set<() => void>();

/** Status suara Indonesia di perangkat: "unknown" (belum dimuat), "ada", atau "tidak". */
export function useIdVoiceStatus() {
  const [status, setStatus] = useState<"unknown" | "ada" | "tidak">("unknown");
  useEffect(() => {
    const check = () => {
      if (!window.speechSynthesis) return setStatus("tidak");
      const voices = loadVoices();
      if (!voices.length) return;
      setStatus(hasVoiceFor("id-ID") ? "ada" : "tidak");
    };
    check();
    voiceSubs.add(check);
    const t = setTimeout(check, 1500);
    return () => {
      voiceSubs.delete(check);
      clearTimeout(t);
    };
  }, []);
  return status;
}

/**
 * Mesin suara tanpa suara Indonesia akan membaca suku kata dengan logat Inggris
 * ("ca" jadi "ka", "hi" jadi "hai"). Ejaan di bawah memaksa bunyi yang mendekati
 * bahasa Indonesia untuk kata atau suku kata tunggal.
 */
function respellForEnglishVoice(word: string) {
  const w = word.toLowerCase();
  if (!/^[a-z]{1,10}$/.test(w)) return word;
  const VOWEL: Record<string, string> = { a: "ah", i: "ee", u: "oo", e: "eh", o: "oh" };
  return w
    .replace(/sy/g, "sh")
    .replace(/c(?!h)/g, "ch")
    .replace(/[aiueo]/g, (v) => VOWEL[v]);
}

/** Kata Indonesia yang bentuknya sama dengan kata Inggris, dibaca keliru walau suara Indonesia ada. */
const ID_VOICE_FIX: Record<string, string> = { hi: "hii" };

function ttsText(text: string, lang: string, hasVoice: boolean) {
  if (baseOf(lang) !== "id") return text;
  // Satu kata atau suku kata yang diulang ("ca, ca, ca") dieja ulang per kata.
  const tokens = text.split(/[\s,.!]+/).filter(Boolean);
  const same =
    tokens.length > 0 &&
    tokens.every((t) => /^[A-Za-z]+$/.test(t) && t.toLowerCase() === tokens[0].toLowerCase());
  if (!same) return text;
  const one = hasVoice ? (ID_VOICE_FIX[tokens[0].toLowerCase()] ?? tokens[0]) : respellForEnglishVoice(tokens[0]);
  return Array(tokens.length).fill(one).join(", ");
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

/* ---------- Gerbang jawaban: terkunci selama ada suara dibacakan ---------- */
let speaking = false;
const gateSubs = new Set<(v: boolean) => void>();
export const isSpeaking = () => speaking;
export function subscribeSpeaking(fn: (v: boolean) => void) {
  gateSubs.add(fn);
  return () => {
    gateSubs.delete(fn);
  };
}
let speakGen = 0;
function beginSpeak() {
  speakGen++;
  if (!speaking) {
    speaking = true;
    gateSubs.forEach((f) => f(true));
  }
  return speakGen;
}
function endSpeak(g: number) {
  if (g !== speakGen || !speaking) return;
  speaking = false;
  gateSubs.forEach((f) => f(false));
}

/** Putar rekaman suara ayah/ibu, dengan sorotan kata (perkiraan menurut panjang kata). */
function playClip(text: string, clip: ClipInfo, opts: SpeakOptions) {
  stopSpeaking();
  const g = beginSpeak();
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
    endSpeak(g);
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
  const g = beginSpeak();
  const lang = opts.lang ?? "id-ID";
  const v = pickVoice(lang);
  const u = new SpeechSynthesisUtterance(ttsText(text, lang, Boolean(v)));
  u.lang = lang;
  u.rate = opts.rate ?? (lang === "en-US" ? 0.85 : 0.9);
  u.pitch = 1.05;
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
    endSpeak(g);
    opts.onWord?.(-1);
    opts.onEnd?.();
  };
  u.onerror = u.onend as never;
  window.speechSynthesis.speak(u);
}

export function speakAsync(text: string, opts: Omit<SpeakOptions, "onEnd"> = {}) {
  return new Promise<void>((resolve) => speak(text, { ...opts, onEnd: resolve }));
}

/**
 * Ucapkan satu suku kata beberapa kali, jelas dan berurutan ("ca, ca, ca").
 * Kalau ayah atau ibu sudah merekam suku kata itu, rekamannya yang diputar.
 */
export function speakSyllable(syl: string, times = 3, opts: Pick<SpeakOptions, "onEnd"> = {}) {
  if (!getClip(syl)) {
    speak(Array(times).fill(syl).join(", "), opts);
    return;
  }
  const again = (n: number) => speak(syl, { onEnd: n > 1 ? () => again(n - 1) : opts.onEnd });
  again(times);
}
