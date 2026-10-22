import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DIGIT_STROKES, ID_WORDS, isDigit, keycap } from "@/data/numbers";
import { addStars, saveProfile } from "@/lib/store";
import { KidPage } from "@/components/kid/TopBar";
import { Celebration } from "@/components/kid/Celebration";
import { TraceLetter } from "@/components/kid/Trace";
import { Instruction } from "@/components/kid/Speaker";
import { NumberCountStep, NumberIntro, NumberQuizStep, NumberTakeStep } from "@/components/kid/NumberActivities";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/angka/$digit")({
  loader: ({ params }) => {
    if (!isDigit(params.digit)) throw notFound();
    return { digit: Number(params.digit) };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Angka ${params.digit} — Belajar Ceria` },
      { name: "description", content: `Mengenal, menghitung, dan menulis angka ${params.digit} dengan suara dan permainan.` },
    ],
  }),
  component: DigitModule,
});

const STEP_ICON: Record<string, string> = { kenal: "👀", trace: "✏️", hitung: "🔢", ambil: "🧺", kuis: "🧠" };

function TraceDigitStep({ d, onDone }: { d: number; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Instruction text={`Ayo menulis angka ${ID_WORDS[d]}. Mulai dari titik hijau, ikuti arah panah ya.`} />
      <div className="font-display text-3xl">
        Angka <span className="text-ink">{d}</span>
      </div>
      <TraceLetter strokes={DIGIT_STROKES[d]} onDone={onDone} />
    </div>
  );
}

function DigitModule() {
  const { digit: d } = Route.useLoaderData();
  const steps = d === 0 ? ["kenal", "trace", "hitung", "kuis"] : ["kenal", "trace", "hitung", "ambil", "kuis"];
  const [step, setStep] = useState(0);
  const [celebrate, setCelebrate] = useState<null | { kind: "step" | "final"; perfect: boolean }>(null);
  const navigate = useNavigate();

  const next = (perfect = true) => {
    // Reward penuh untuk anak yang benar di percobaan pertama.
    addStars(perfect ? 2 : 1);
    if (step + 1 >= steps.length) {
      saveProfile((p) => ({
        numbers: p.numbers.includes(d) ? p.numbers : [...p.numbers, d],
        stars: p.stars + 2,
      }));
      setCelebrate({ kind: "final", perfect });
    } else setCelebrate({ kind: "step", perfect });
  };

  const cur = steps[step];
  return (
    <KidPage title={`Angka ${d}`}>
      <div className="mb-5 flex justify-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-2xl",
              i < step ? "bg-mint" : i === step ? "bg-butter ring-4 ring-primary" : "bg-muted opacity-60",
            )}
          >
            {i < step ? "⭐" : STEP_ICON[s]}
          </div>
        ))}
      </div>

      <div key={cur}>
        {cur === "kenal" && <NumberIntro d={d} onDone={next} />}
        {cur === "trace" && <TraceDigitStep d={d} onDone={next} />}
        {cur === "hitung" && <NumberCountStep d={d} onDone={next} />}
        {cur === "ambil" && <NumberTakeStep d={d} onDone={next} />}
        {cur === "kuis" && <NumberQuizStep d={d} onDone={next} />}
      </div>

      {celebrate?.kind === "step" && (
        <Celebration
          stars={celebrate.perfect ? 2 : 1}
          message={celebrate.perfect ? "Luar biasa! Benar di percobaan pertama. Dua bintang untukmu!" : "Hebat! Kamu dapat bintang!"}
          onClose={() => { setCelebrate(null); setStep(step + 1); }}
        />
      )}
      {celebrate?.kind === "final" && (
        <Celebration
          stars={celebrate.perfect ? 4 : 3}
          sticker={keycap(d)}
          message={`Hore! Angka ${ID_WORDS[d]} selesai. Kamu dapat stiker baru!`}
          onClose={() => navigate({ to: "/" })}
        />
      )}
    </KidPage>
  );
}
