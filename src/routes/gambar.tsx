import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { KidPage } from "@/components/kid/TopBar";
import { PaintStudio } from "@/components/paint/PaintStudio";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/gambar")({
  head: () => ({
    meta: [
      { title: "Menggambar dan Mewarnai | Belajar Ceria" },
      { name: "description", content: "Menggambar dan mewarnai dengan lapisan, banyak warna, dan gradasi." },
    ],
  }),
  component: Gambar,
});

function Gambar() {
  useEffect(() => {
    const t = setTimeout(() => speak("Ayo menggambar dan mewarnai!"), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <KidPage title="Menggambar">
      <PaintStudio />
    </KidPage>
  );
}
