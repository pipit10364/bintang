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

## Data

Tidak ada database. Nama anak, keluarga, cerita buatan sendiri, PIN, bintang, dan stiker
disimpan di `localStorage` browser pada HP/tablet yang dipakai, jadi tidak ikut pindah ke
perangkat atau alamat (domain) lain.
