import { useEffect, useMemo, useRef, useState } from "react";
import { LETTERS } from "@/data/letters";
import { ID_WORDS } from "@/data/numbers";
import { STORIES } from "@/data/stories";
import type { CustomStory } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/speech";
import { clearClips, clipCount, deleteClip, hasClip, saveClip, startRecording, useClipVersion } from "@/lib/recordings";
import { PRAISE } from "@/components/kid/Speaker";
import { Button } from "@/components/ui/button";

type Group = { id: string; title: string; items: string[] };

function buildGroups(stories: CustomStory[]): Group[] {
  return [
    {
      id: "pujian",
      title: "💬 Pujian dan semangat",
      // dua kalimat terakhir sama persis dengan yang diucapkan di aplikasi
      items: [...PRAISE, "Hmm, coba lagi ya!", "Bagus! Sekarang garis berikutnya."],
    },
    { id: "hitung", title: "🔢 Berhitung 0–10", items: ID_WORDS },
    { id: "huruf", title: "🔤 Nama huruf", items: LETTERS.map((l) => `Huruf ${l.letter}`) },
    ...STORIES.map((s) => ({
      id: s.id,
      title: `${s.emoji} ${s.title}`,
      items: [s.title, ...s.pages.map((p) => p.text)],
    })),
    ...stories.map((s) => ({
      id: s.id,
      title: `${s.emoji} ${s.title} (cerita sendiri)`,
      items: [s.title, ...s.pages],
    })),
  ];
}

export function VoiceStudio({ stories }: { stories: CustomStory[] }) {
  useClipVersion();
  const groups = useMemo(() => buildGroups(stories), [stories]);
  const [recText, setRecText] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const recRef = useRef<{ stop: () => Promise<{ blob: Blob; ms: number }> } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      void recRef.current?.stop();
      recRef.current = null;
      stopSpeaking();
    },
    [],
  );

  const finish = async (text: string) => {
    clearTimeout(timer.current);
    const r = recRef.current;
    recRef.current = null;
    setRecText(null);
    if (!r) return;
    try {
      const { blob, ms } = await r.stop();
      if (ms < 500) setErr("Rekamannya terlalu pendek, coba lagi.");
      else await saveClip(text, blob, ms);
    } catch {
      setErr("Rekaman gagal disimpan di perangkat ini.");
    }
  };

  const start = async (text: string) => {
    if (recRef.current) return;
    setErr("");
    stopSpeaking();
    try {
      recRef.current = await startRecording();
      setRecText(text);
      timer.current = setTimeout(() => void finish(text), 45000);
    } catch {
      setErr("Mikrofon tidak bisa dipakai. Izinkan akses mikrofon untuk situs ini di Chrome, lalu coba lagi.");
    }
  };

  return (
    <section className="space-y-3 rounded-3xl bg-card p-5">
      <h2 className="text-xl">🎙️ Rekam Suara Ayah/Ibu</h2>
      <p className="text-sm text-muted-foreground">
        Bacakan kalimat di bawah dengan suara sendiri. Anak akan mendengar rekamanmu, bukan suara mesin. Bagian yang
        belum direkam tetap memakai suara mesin. Rekaman hanya disimpan di perangkat ini dan tidak dikirim ke mana
        pun, jadi rekamlah di HP/tablet yang dipakai anak.
      </p>
      {err && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

      {groups.map((g) => {
        const done = g.items.filter(hasClip).length;
        return (
          <details key={g.id} className="rounded-2xl bg-muted/60 p-3">
            <summary className="cursor-pointer font-display text-lg">
              {g.title}{" "}
              <span className="text-sm text-muted-foreground">
                ({done}/{g.items.length})
              </span>
            </summary>
            <ul className="mt-3 space-y-2">
              {g.items.map((text) => {
                const has = hasClip(text);
                const rec = recText === text;
                return (
                  <li key={text} className="space-y-2 rounded-xl bg-card p-3">
                    <p className="text-sm">“{text}”</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {rec ? (
                        <Button size="sm" variant="destructive" onClick={() => void finish(text)}>
                          ⏹ Selesai
                        </Button>
                      ) : (
                        <Button size="sm" disabled={recText !== null} onClick={() => void start(text)}>
                          {has ? "🔁 Rekam ulang" : "🎙️ Rekam"}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={recText !== null} onClick={() => speak(text)}>
                        ▶ Putar
                      </Button>
                      {has && !rec && (
                        <Button size="sm" variant="ghost" disabled={recText !== null} onClick={() => void deleteClip(text)}>
                          🗑 Hapus
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {rec ? "🔴 Merekam… ketuk Selesai kalau sudah" : has ? "🎙️ suara sendiri" : "🤖 suara mesin"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">Total rekaman: {clipCount()}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={recText !== null || clipCount() === 0}
          onClick={() => confirm("Hapus semua rekaman suara?") && void clearClips()}
        >
          Hapus semua rekaman
        </Button>
      </div>
    </section>
  );
}
