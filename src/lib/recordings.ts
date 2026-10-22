// Rekaman suara ayah/ibu: disimpan di IndexedDB perangkat ini (tidak dikirim ke mana pun).
import { useEffect, useState } from "react";

/** Bersihkan teks sebelum dibacakan atau dicocokkan dengan rekaman (emoji dibuang). */
export const cleanSpeechText = (t: string) =>
  t.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s{2,}/g, " ").trim();

/** Kunci rekaman = teks yang dibacakan (tanpa emoji, huruf kecil), diringkas jadi hash. */
export const clipKey = (text: string) => {
  const s = cleanSpeechText(text).toLowerCase();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(16)}-${s.length}`;
};

type Row = { key: string; text: string; blob: Blob; ms: number };
export type ClipInfo = { url: string; ms: number };

const DB_NAME = "belajar-ceria-voice";
const STORE = "clips";
const clips = new Map<string, ClipInfo>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "key" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise<T>((resolve, reject) => {
    const r = fn(d.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export const getClip = (text: string) => clips.get(clipKey(text));
export const hasClip = (text: string) => clips.has(clipKey(text));
export const clipCount = () => clips.size;

export async function initRecordings() {
  try {
    const rows = (await run("readonly", (s) => s.getAll())) as Row[];
    rows.forEach((r) => clips.set(r.key, { url: URL.createObjectURL(r.blob), ms: r.ms }));
    notify();
  } catch {
    /* IndexedDB tidak tersedia: aplikasi tetap jalan dengan suara mesin */
  }
}

export async function saveClip(text: string, blob: Blob, ms: number) {
  const key = clipKey(text);
  await run("readwrite", (s) => s.put({ key, text: cleanSpeechText(text), blob, ms } satisfies Row));
  const old = clips.get(key);
  if (old) URL.revokeObjectURL(old.url);
  clips.set(key, { url: URL.createObjectURL(blob), ms });
  notify();
}

export async function deleteClip(text: string) {
  const key = clipKey(text);
  try {
    await run("readwrite", (s) => s.delete(key));
  } catch {
    /* abaikan */
  }
  const old = clips.get(key);
  if (old) URL.revokeObjectURL(old.url);
  clips.delete(key);
  notify();
}

export async function clearClips() {
  try {
    await run("readwrite", (s) => s.clear());
  } catch {
    /* abaikan */
  }
  clips.forEach((c) => URL.revokeObjectURL(c.url));
  clips.clear();
  notify();
}

/** Render ulang komponen saat rekaman bertambah/berkurang. */
export function useClipVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const f = () => setV((x) => x + 1);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  return v;
}

/** Mulai merekam dari mikrofon. Panggil stop() untuk mendapatkan hasilnya. */
export async function startRecording() {
  if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Perekaman tidak didukung");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  const t0 = performance.now();
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  rec.start();
  return {
    stop: () =>
      new Promise<{ blob: Blob; ms: number }>((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve({ blob: new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }), ms: performance.now() - t0 });
        };
        rec.stop();
      }),
  };
}

if (typeof window !== "undefined" && typeof indexedDB !== "undefined") void initRecordings();
