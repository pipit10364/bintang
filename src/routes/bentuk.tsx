import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { addStars, saveProfile } from "@/lib/store";
import { KidPage } from "@/components/kid/TopBar";
import { ShapesModule } from "@/components/kid/Shapes";
import { Celebration } from "@/components/kid/Celebration";

export const Route = createFileRoute("/bentuk")({
  head: () => ({
    meta: [
      { title: "Belajar Bentuk | Belajar Ceria" },
      {
        name: "description",
        content: "Mengenal lingkaran, persegi, segitiga, dan bentuk dasar lain dengan suara.",
      },
    ],
  }),
  component: ShapesPage,
});

function ShapesPage() {
  const [done, setDone] = useState<null | boolean>(null);
  const navigate = useNavigate();
  return (
    <KidPage title="Belajar Bentuk">
      <ShapesModule
        onDone={(perfect) => {
          addStars(perfect ? 3 : 2);
          saveProfile({ shapes: true });
          setDone(perfect);
        }}
      />
      {done !== null && (
        <Celebration
          stars={done ? 3 : 2}
          sticker="🔷"
          message="Hore! Kamu sudah kenal bentuk. Kamu dapat stiker baru!"
          onClose={() => navigate({ to: "/" })}
        />
      )}
    </KidPage>
  );
}
