import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { confusableGroupOf, drillWords, getLetter, LETTERS } from "@/data/letters";
import { storyForLetter } from "@/data/stories";
import { addStars, saveProfile, useProfile } from "@/lib/store";
import { KidPage } from "@/components/kid/TopBar";
import { StoryReader } from "@/components/kid/Story";
import { AssessmentStep, ConfusableStep, DetectiveStep, MathStep, TraceStep } from "@/components/kid/Activities";
import { SpellingStep } from "@/components/kid/Spelling";
import { ReadWordsStep, TypeWordsStep } from "@/components/kid/Inputs";
import { Celebration } from "@/components/kid/Celebration";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/huruf/$letter")({
  loader: ({ params }) => {
    const data = getLetter(params.letter);
    if (!data) throw notFound();
    return { letter: data.letter };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Huruf ${params.letter.toUpperCase()} — Belajar Ceria` },
      { name: "description", content: `Cerita, menulis, detektif kata, berhitung, dan latihan untuk huruf ${params.letter.toUpperCase()}.` },
      { property: "og:title", content: `Huruf ${params.letter.toUpperCase()} — Belajar Ceria` },
      { property: "og:description", content: `Belajar huruf ${params.letter.toUpperCase()} dengan suara dan permainan.` },
    ],
  }),
  component: LetterModule,
});

const STEP_ICON: Record<string, string> = {
  story: "📖", trace: "✏️", twin: "🔁", eja: "🔤", detective: "🔎", ketik: "⌨️", baca: "🎤", math: "🔢", quiz: "🧠",
};

function LetterModule() {
  const { letter } = Route.useLoaderData();
  const data = getLetter(letter)!;
  const index = LETTERS.findIndex((l) => l.letter === letter);
  const story = storyForLetter(index);
  const group = confusableGroupOf(letter);
  const steps = ["story", "trace", ...(group ? ["twin"] : []), "eja", "detective", "ketik", "baca", "math", "quiz"];
  const [step, setStep] = useState(0);
  const [celebrate, setCelebrate] = useState<null | { kind: "step" | "final"; perfect: boolean }>(null);
  const { profile } = useProfile();
  const navigate = useNavigate();

  const next = (perfect = true) => {
    // Reward penuh untuk anak yang benar di percobaan pertama.
    addStars(perfect ? 2 : 1);
    if (step + 1 >= steps.length) {
      saveProfile((p) => ({ stickers: p.stickers.includes(letter) ? p.stickers : [...p.stickers, letter], stars: p.stars + 2 }));
      setCelebrate({ kind: "final", perfect });
    } else setCelebrate({ kind: "step", perfect });
  };

  // Kata latihan ketik dan baca keras: tiga kata terpendek dengan gambar yang jelas.
  const drill = drillWords(data.words, 3).map((w) => ({ text: w.id, emoji: w.emoji }));
  const cur = steps[step];
  return (
    <KidPage title={`Huruf ${letter} ${letter.toLowerCase()}`}>
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-xl sm:h-12 sm:w-12 sm:text-2xl",
              i < step ? "bg-mint" : i === step ? "bg-butter ring-4 ring-primary" : "bg-muted opacity-60",
            )}
          >
            {i < step ? "⭐" : STEP_ICON[s]}
          </div>
        ))}
      </div>

      <div key={cur}>
        {cur === "story" && <StoryReader title={story.title} pages={story.pages} onDone={next} />}
        {cur === "trace" && <TraceStep letter={letter} onDone={next} />}
        {cur === "twin" && group && <ConfusableStep group={group} onDone={next} />}
        {cur === "eja" && <SpellingStep letter={letter} words={data.words} onDone={next} />}
        {cur === "detective" && <DetectiveStep data={data} onDone={next} />}
        {cur === "ketik" && <TypeWordsStep words={drill} onDone={next} />}
        {cur === "baca" && <ReadWordsStep words={drill} onDone={next} />}
        {cur === "math" && <MathStep emoji={data.words[0].emoji} onDone={next} />}
        {cur === "quiz" && <AssessmentStep profile={profile} onDone={next} />}
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
          sticker={data.words[0].emoji}
          message={`Hore! Huruf ${letter} selesai. Kamu dapat stiker baru!`}
          onClose={() => navigate({ to: "/" })}
        />
      )}
    </KidPage>
  );
}
