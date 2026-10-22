import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useProfile } from "@/lib/store";
import { speak } from "@/lib/speech";
import { KidPage } from "@/components/kid/TopBar";
import { FreeTrace } from "@/components/kid/Trace";
import { Instruction } from "@/components/kid/Speaker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/keluarga")({
  head: () => ({
    meta: [
      { title: "Namaku & Keluargaku — Belajar Ceria" },
      { name: "description", content: "Latihan menulis dan membaca nama sendiri serta nama anggota keluarga." },
      { property: "og:title", content: "Namaku & Keluargaku — Belajar Ceria" },
      { property: "og:description", content: "Menulis dan membaca nama keluarga dengan suara." },
    ],
  }),
  component: Family,
});

function Family() {
  const { profile, ready } = useProfile();
  const people = [
    profile.childName && { name: profile.childName, relation: "Aku", emoji: "🧒" },
    profile.motherName && { name: profile.motherName, relation: "Ibu", emoji: "👩" },
    profile.fatherName && { name: profile.fatherName, relation: "Ayah", emoji: "👨" },
    ...profile.family.map((f) => ({ ...f, emoji: "💛" })),
  ].filter(Boolean) as { name: string; relation: string; emoji: string }[];
  const [sel, setSel] = useState(0);

  if (ready && !people.length)
    return (
      <KidPage title="Namaku & Keluarga">
        <Instruction text="Minta ayah atau ibu menulis nama keluarga dulu di Portal Orang Tua ya." />
        <Link to="/orangtua" className="mt-6 block rounded-3xl bg-peach p-6 text-center font-display text-2xl">
          Portal Orang Tua 🔒
        </Link>
      </KidPage>
    );
  const p = people[sel];
  if (!p) return <KidPage title="Namaku & Keluarga">{null}</KidPage>;

  return (
    <KidPage title="Namaku & Keluarga">
      <div className="mb-4 flex flex-wrap gap-3">
        {people.map((x, i) => (
          <button key={i} onClick={() => { setSel(i); speak(`${x.relation}. ${x.name}`); }}
            className={cn("rounded-3xl px-5 py-3 font-display text-xl shadow-[0_5px_0_var(--border)]", i === sel ? "bg-butter" : "bg-card")}>
            {x.emoji} {x.relation}
          </button>
        ))}
      </div>
      <Instruction key={sel} text={`Ini nama ${p.relation === "Aku" ? "kamu" : p.relation}: ${p.name}. Ayo ditebalkan dengan jarimu!`} />
      <div className="mt-4">
        <FreeTrace key={sel} text={p.name} />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {p.name.split("").map((c, i) => (
          <button key={i} onClick={() => c.trim() && speak(c.toLowerCase())} className="h-16 w-16 rounded-2xl bg-sky font-display text-4xl">
            {c}
          </button>
        ))}
      </div>
    </KidPage>
  );
}
