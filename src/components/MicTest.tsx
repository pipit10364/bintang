import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { stopSpeaking } from "@/lib/speech";
import {
  environmentHints,
  listenOnce,
  parentMessage,
  recognitionSupported,
  stopListening,
  type ListenResult,
} from "@/lib/recognition";

type Stage = "idle" | "listening";

const Row = ({ ok, label }: { ok: boolean; label: string }) => (
  <li className={ok ? "text-foreground" : "text-muted-foreground"}>
    {ok ? "✅" : "⬜"} {label}
  </li>
);

/**
 * Tes mikrofon untuk orang tua. Menunjukkan tiga tahap: mikrofon menyala, suara terdeteksi,
 * dan teks terbaca. Dari tahap yang tidak tercentang, kelihatan penyebab "suara tidak masuk".
 */
export function MicTest() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [live, setLive] = useState({ mic: false, speech: false, text: "" });
  const [result, setResult] = useState<ListenResult | null>(null);
  const [hints, setHints] = useState<string[]>([]);

  useEffect(() => {
    setSupported(recognitionSupported());
    setHints(environmentHints());
    return () => stopListening();
  }, []);

  const run = async () => {
    if (stage === "listening") return stopListening();
    stopSpeaking();
    setResult(null);
    setLive({ mic: false, speech: false, text: "" });
    setStage("listening");
    const r = await listenOnce("id-ID", {
      onPhase: (p) => setLive((l) => ({ ...l, mic: true, speech: p === "speech" || l.speech })),
      onInterim: (t) => setLive((l) => ({ ...l, speech: true, text: t })),
      maxMs: 7000,
    });
    setResult(r);
    setStage("idle");
  };

  const mic = result?.micOpened ?? live.mic;
  const speech = result?.speechDetected ?? live.speech;
  const text = result ? result.heard[0] : live.text;
  const allGood = Boolean(result && !result.error && result.heard.length);

  return (
    <section className="space-y-3 rounded-3xl bg-sky/40 p-5">
      <h2 className="text-xl">🎤 Tes Mikrofon</h2>
      <p className="text-sm text-muted-foreground">
        Dipakai di latihan "baca keras". Tekan tombol, lalu ucapkan satu kata, misalnya "bola".
      </p>
      {supported === false ? (
        <p className="text-sm">{parentMessage.unsupported}</p>
      ) : (
        <>
          <Button onClick={run} disabled={supported === null}>
            {stage === "listening" ? "Mendengarkan... (ketuk untuk berhenti)" : "Mulai tes"}
          </Button>
          {(stage === "listening" || result) && (
            <ul className="space-y-1 text-sm">
              <Row ok={mic} label="Mikrofon menyala" />
              <Row ok={speech} label="Suara terdeteksi" />
              <Row ok={Boolean(text)} label={text ? `Teks terbaca: "${text}"` : "Teks terbaca"} />
            </ul>
          )}
          {allGood && <p className="text-sm font-semibold">Mikrofon berfungsi baik.</p>}
          {result && !allGood && (
            <p className="text-sm">
              {result.error
                ? parentMessage[result.error]
                : !result.speechDetected
                  ? parentMessage["no-speech"]
                  : "Suara terdeteksi tetapi tidak berhasil diubah jadi teks. Biasanya karena internet lemah. Coba lagi."}
            </p>
          )}
        </>
      )}
      {hints.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
