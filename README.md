# Bintang Pintar

Aplikasi belajar untuk anak yang akan masuk SD: membaca, menulis, berhitung, dan bahasa Inggris dasar.
Semua instruksi bersuara, tanpa iklan, dan bisa dipasang di layar utama (PWA).

Tumpukan teknologi: TanStack Start (React) + Tailwind CSS, build dengan Vite.

## Menjalankan di komputer

```sh
npm install
npm run dev
npm run build
npm test
```

## Deploy ke Vercel

1. Upload proyek ke GitHub (commit juga `package-lock.json` yang dibuat oleh `npm install`).
2. Di Vercel: Add New, Project, pilih repo ini.
3. Build command `npm run build`. Tidak ada environment variable yang diperlukan.

## Menggambar & mewarnai

Halaman `/gambar`: lapisan (maks. 6), kuas, kuas gradasi, penghapus, ember cat, gradasi lurus/melingkar,
roda warna dan palet lingkaran, urungkan/ulang, 6 gambar garis siap warnai, simpan sebagai PNG. Gambar
tersimpan otomatis di perangkat (IndexedDB) dan jalan tanpa internet. Mesinnya ada di
`src/lib/paint-engine.ts` (tanpa React), tampilannya di `src/components/paint/`.
Gambar garis baru ditambah di `src/lib/paint-templates.ts`.

## Mode offline

`public/sw.js` (service worker) menyimpan semua halaman dan file aplikasi di perangkat. Aktif hanya di versi
hasil build (bukan `npm run dev`). Cara pakai: buka aplikasi sekali dengan internet; semua pelajaran diunduh
otomatis di latar belakang (status dan tombol "Simpan untuk offline" ada di Portal Orang Tua). Setelah itu bisa
dibuka tanpa internet, juga dari ikon layar utama. Setelah mengubah `sw.js`, naikkan `VERSION` di dalamnya.
Tanpa internet: baca keras dinilai orang tua (pengenalan suara Chrome butuh internet), dan suara memakai suara
bahasa Indonesia yang terpasang di perangkat atau rekaman ayah/ibu.

## Data

Tidak ada database. Nama anak, keluarga, cerita buatan sendiri, PIN, bintang, dan stiker
disimpan di `localStorage` browser pada HP/tablet yang dipakai, jadi tidak ikut pindah ke
perangkat atau alamat (domain) lain.
