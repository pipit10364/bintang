import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { saveProfile, useProfile, type Profile } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useIdVoiceStatus } from "@/lib/speech";
import { VoiceStudio } from "@/components/VoiceStudio";
import { MicTest } from "@/components/MicTest";
import { vibrateNo, vibrateOk } from "@/lib/haptics";

export const Route = createFileRoute("/orangtua")({
  head: () => ({
    meta: [
      { title: "Portal Orang Tua — Belajar Ceria" },
      { name: "description", content: "Atur nama anak, keluarga, PIN, dan tambahkan cerita sendiri." },
      { property: "og:title", content: "Portal Orang Tua — Belajar Ceria" },
      { property: "og:description", content: "Pengaturan khusus orang tua." },
    ],
  }),
  component: Parent,
});

function Gate({ pin, onOpen }: { pin: string; onOpen: () => void }) {
  const q = useMemo(() => {
    const a = 11 + Math.floor(Math.random() * 30);
    const b = 6 + Math.floor(Math.random() * 9);
    return { a, b };
  }, []);
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const check = () => {
    const ok = pin ? v === pin : Number(v) === q.a * q.b;
    if (ok) onOpen();
    else setErr(true);
  };
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl">🔒 Khusus Orang Tua</h1>
      <p className="text-muted-foreground">
        {pin ? "Masukkan PIN orang tua." : `Jawab untuk masuk: ${q.a} × ${q.b} = ?`}
      </p>
      <Input inputMode="numeric" type={pin ? "password" : "text"} value={v} onChange={(e) => { setV(e.target.value); setErr(false); }}
        onKeyDown={(e) => e.key === "Enter" && check()} className="h-14 text-2xl" />
      {err && <p className="text-destructive">Belum tepat, coba lagi.</p>}
      <Button size="lg" onClick={check}>Masuk</Button>
      <Link to="/" className="text-center text-sm text-muted-foreground underline">Kembali</Link>
    </div>
  );
}

function Parent() {
  const { profile, ready } = useProfile();
  const [open, setOpen] = useState(false);
  if (!ready) return null;
  if (!open) return <Gate pin={profile.pin} onOpen={() => setOpen(true)} />;
  return <Settings profile={profile} />;
}

function Settings({ profile }: { profile: Profile }) {
  const [f, setF] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [rel, setRel] = useState("");
  const [name, setName] = useState("");
  const [specName, setSpecName] = useState("");
  const [specEmoji, setSpecEmoji] = useState("😊");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("💖");
  const [body, setBody] = useState("");

  const save = (next: Partial<Profile>) => {
    const merged = { ...f, ...next };
    setF(merged);
    saveProfile(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Portal Orang Tua</h1>
        <Link to="/" className="rounded-full bg-peach px-4 py-2 font-display">🏠 Ke Anak</Link>
      </div>
      {saved && <div className="rounded-xl bg-mint p-3 text-center">Tersimpan ✓</div>}

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <h2 className="text-xl">Data Anak & Orang Tua</h2>
        <p className="text-sm text-muted-foreground">Dipakai untuk latihan menulis nama dan soal "siapa namamu?".</p>
        {(["childName", "motherName", "fatherName"] as const).map((k) => (
          <label key={k} className="block">
            <span className="text-sm">{{ childName: "Nama panggilan anak", motherName: "Nama ibu", fatherName: "Nama ayah" }[k]}</span>
            <Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="h-12 text-lg" />
          </label>
        ))}
        <Button onClick={() => save({ childName: f.childName.trim(), motherName: f.motherName.trim(), fatherName: f.fatherName.trim() })}>Simpan</Button>
      </section>

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <h2 className="text-xl">Anggota Keluarga Lain</h2>
        <ul className="space-y-2">
          {f.family.map((m, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <span><b>{m.relation}</b>: {m.name}</span>
              <Button variant="ghost" size="sm" onClick={() => save({ family: f.family.filter((_, j) => j !== i) })}>Hapus</Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Hubungan (kakak, nenek…)" value={rel} onChange={(e) => setRel(e.target.value)} className="flex-1" />
          <Input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button disabled={!rel.trim() || !name.trim()} onClick={() => { save({ family: [...f.family, { relation: rel.trim().toLowerCase(), name: name.trim() }] }); setRel(""); setName(""); }}>Tambah</Button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <h2 className="text-xl">⭐ Benda Khusus Anak</h2>
        <p className="text-sm text-muted-foreground">
          Mainan kesayangan, hewan peliharaan, atau benda spesial lain. Dipakai di kuis "mana benda kesayanganmu?".
        </p>
        <ul className="space-y-2">
          {f.specials?.map((s, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <span>{s.emoji} {s.name}</span>
              <Button variant="ghost" size="sm" onClick={() => save({ specials: (f.specials ?? []).filter((_, j) => j !== i) })}>Hapus</Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="😊" value={specEmoji} onChange={(e) => setSpecEmoji(e.target.value)} className="w-20 text-center text-2xl" />
          <Input placeholder="Nama benda (mis. boneka Bruno)" value={specName} onChange={(e) => setSpecName(e.target.value)} className="flex-1" />
          <Button
            disabled={!specName.trim()}
            onClick={() => {
              save({ specials: [...(f.specials ?? []), { name: specName.trim(), emoji: specEmoji.trim() || "⭐" }] });
              setSpecName("");
              setSpecEmoji("😊");
            }}
          >
            Tambah
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <h2 className="text-xl">Tambah Cerita Sendiri</h2>
        <p className="text-sm text-muted-foreground">Pisahkan setiap halaman dengan baris kosong. Cerita akan dibacakan dengan sorotan kata.</p>
        <div className="flex gap-2">
          <Input placeholder="😊" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-20 text-center text-2xl" />
          <Input placeholder="Judul cerita" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <Textarea rows={6} placeholder={"Halaman 1...\n\nHalaman 2..."} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button
          disabled={!title.trim() || !body.trim()}
          onClick={() => {
            const pages = body.split(/\n\s*\n/).map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean);
            save({ stories: [...f.stories, { id: `c-${Date.now()}`, title: title.trim(), emoji: emoji.trim() || "💖", pages }] });
            setTitle(""); setBody("");
          }}
        >
          Simpan Cerita
        </Button>
        <ul className="space-y-2">
          {f.stories.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <span>{s.emoji} {s.title} ({s.pages.length} hal.)</span>
              <Button variant="ghost" size="sm" onClick={() => save({ stories: f.stories.filter((x) => x.id !== s.id) })}>Hapus</Button>
            </li>
          ))}
        </ul>
      </section>

      <VoiceNotice />

      <MicTest />

      <VoiceStudio stories={f.stories} />

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <h2 className="text-xl">📳 Getaran</h2>
        <p className="text-sm text-muted-foreground">
          Jawaban benar bergetar tiga denyut pendek, jawaban salah bergetar satu kali panjang. Hanya berfungsi di
          Android, dan HP harus mengaktifkan getaran sentuhan di pengaturannya.
        </p>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5" checked={f.haptics !== false} onChange={(e) => save({ haptics: e.target.checked })} />
          <span>Aktifkan getaran</span>
        </label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={vibrateOk}>Tes: benar</Button>
          <Button variant="outline" onClick={vibrateNo}>Tes: salah</Button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <h2 className="text-xl">Keamanan & Progres</h2>
        <label className="block">
          <span className="text-sm">PIN orang tua (kosongkan untuk pakai soal perkalian)</span>
          <Input inputMode="numeric" maxLength={6} value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "") })} />
        </label>
        <Button onClick={() => save({ pin: f.pin })}>Simpan PIN</Button>
        <p className="text-sm">⭐ {f.stars} bintang · 🏅 {f.stickers.length}/26 huruf · 🔢 {(f.numbers ?? []).length}/10 angka selesai</p>
        <Button variant="outline" onClick={() => confirm("Reset bintang dan stiker?") && save({ stars: 0, stickers: [], numbers: [] })}>Reset progres</Button>
      </section>

      <section className="space-y-2 rounded-3xl bg-butter/50 p-5 text-sm">
        <h2 className="text-xl">📌 Cara mengunci layar untuk anak</h2>
        <p><b>Pasang di layar utama:</b> buka di Chrome/Safari → menu → "Tambahkan ke Layar Utama". Aplikasi terbuka layar penuh tanpa bilah browser.</p>
        <p><b>Android:</b> Setelan → Keamanan → Sematkan aplikasi (Pin app), lalu sematkan Belajar Ceria.</p>
        <p><b>iPhone/iPad:</b> Setelan → Aksesibilitas → Akses Terpandu (Guided Access), lalu klik tombol samping 3× saat aplikasi terbuka.</p>
      </section>
    </div>
  );
}

function VoiceNotice() {
  const status = useIdVoiceStatus();
  if (status === "unknown") return null;
  return (
    <section className={`space-y-2 rounded-3xl p-5 ${status === "ada" ? "bg-mint/50" : "bg-butter/60"}`}>
      <h2 className="text-xl">🔊 Suara Bahasa Indonesia</h2>
      {status === "ada" ? (
        <p className="text-sm text-muted-foreground">
          Perangkat ini punya suara bahasa Indonesia, jadi suku kata dan kata dibacakan dengan logat Indonesia.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Perangkat ini belum punya suara bahasa Indonesia, sehingga suku kata bisa terdengar berlogat Inggris (misalnya
          "ca" terdengar "ka"). Pasang suara Indonesia di pengaturan perangkat (Pengaturan, Bahasa, Output teks ke
          ucapan), atau rekam suara ayah atau ibu di bagian rekaman di bawah ini.
        </p>
      )}
    </section>
  );
}
