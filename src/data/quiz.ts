export type QuizQ = { id: string; cat: string; prompt: string; options: string[]; answer: string; visual?: string };

const q = (id: string, cat: string, prompt: string, options: string[], answer: string, visual?: string): QuizQ => ({
  id, cat, prompt, options, answer, visual,
});

export const QUIZ_BANK: QuizQ[] = [
  // Hewan
  q("h-terbang", "hewan", "Mana hewan yang bisa terbang?", ["🐘", "🐦", "🐟"], "🐦"),
  q("h-air", "hewan", "Mana hewan yang hidup di air?", ["🐟", "🐄", "🐓"], "🐟"),
  q("h-belalai", "hewan", "Mana hewan yang punya belalai?", ["🐘", "🐅", "🐑"], "🐘"),
  q("h-ngeong", "hewan", "Mana hewan yang bunyinya miau?", ["🐱", "🐶", "🐮"], "🐱"),
  q("h-susu", "hewan", "Mana hewan yang menghasilkan susu?", ["🐄", "🐍", "🦆"], "🐄"),
  q("h-kura", "hewan", "Mana hewan yang berjalan pelan dan punya cangkang?", ["🐢", "🐇", "🐆"], "🐢"),
  q("h-madu", "hewan", "Mana hewan yang membuat madu?", ["🐝", "🦋", "🐜"], "🐝"),
  q("h-wortel", "hewan", "Mana hewan yang suka makan wortel?", ["🐰", "🐊", "🦈"], "🐰"),
  q("h-telur", "hewan", "Mana hewan yang bertelur?", ["🐔", "🐕", "🐈"], "🐔"),
  q("h-paus", "hewan", "Mana hewan laut yang paling besar?", ["🐳", "🦀", "🐠"], "🐳"),
  // Langit dan alam
  q("s-malam", "langit", "Kapan kita tidur? Ketuk gambar malam.", ["☀️", "🌙"], "🌙"),
  q("s-siang", "langit", "Mana yang memberi cahaya dan rasa hangat di siang hari?", ["☀️", "🌙", "☁️"], "☀️"),
  q("s-pelangi", "langit", "Apa yang muncul di langit setelah hujan dan matahari?", ["🌈", "❄️", "🔥"], "🌈"),
  q("s-bulan", "langit", "Mana bulan?", ["🌙", "☀️", "☁️"], "🌙"),
  q("s-hujan", "langit", "Apa yang turun dari awan saat hujan?", ["💧", "🪨", "🍬"], "💧"),
  q("s-bumi", "langit", "Tempat tinggal kita namanya Bumi. Mana Bumi?", ["🌍", "🌙", "🪐"], "🌍"),
  // Benda sehari hari
  q("b-sendok", "benda", "Kita makan pakai apa?", ["🥄", "🧦", "🔨"], "🥄"),
  q("b-gelas", "benda", "Kita minum susu dari apa?", ["🥛", "🧦", "🔨"], "🥛"),
  q("b-sikat", "benda", "Kita menggosok gigi pakai apa?", ["🪥", "🥄", "🧦"], "🪥"),
  q("b-payung", "benda", "Kalau hujan, kita pakai apa supaya tidak basah?", ["☂️", "🕶️", "🧦"], "☂️"),
  q("b-pensil", "benda", "Kita menulis pakai apa?", ["✏️", "🥄", "🧴"], "✏️"),
  q("b-sepatu", "benda", "Mana yang dipakai di kaki?", ["👟", "🧢", "🧤"], "👟"),
  q("b-kereta", "benda", "Mana yang berjalan di atas rel?", ["🚆", "🚗", "🛵"], "🚆"),
  q("b-pesawat", "benda", "Mana yang terbang di langit?", ["✈️", "🚢", "🚗"], "✈️"),
  q("b-kapal", "benda", "Mana yang berlayar di laut?", ["🚢", "✈️", "🚲"], "🚢"),
  // Bentuk dan warna
  q("w-lingkaran", "bentuk", "Mana bentuk lingkaran?", ["🔺", "🟦", "⚪"], "⚪"),
  q("w-segitiga", "bentuk", "Mana bentuk segitiga?", ["🔺", "🟦", "⚪"], "🔺"),
  q("w-persegi", "bentuk", "Mana bentuk persegi?", ["⚪", "🔺", "🟦"], "🟦"),
  q("c-merah", "warna", "Mana yang berwarna merah?", ["🔴", "🔵", "🟢"], "🔴"),
  q("c-biru", "warna", "Mana yang berwarna biru?", ["🟡", "🔵", "🟢"], "🔵"),
  q("c-hijau", "warna", "Mana yang berwarna hijau?", ["🟢", "🟡", "🔴"], "🟢"),
  q("c-kuning", "warna", "Mana yang berwarna kuning?", ["🟡", "🔵", "🔴"], "🟡"),
  // Pola dan logika
  q("p-merahbiru", "pola", "Apa yang datang berikutnya? Merah, biru, merah, biru, ...", ["🔴", "🟢", "🟡"], "🔴", "🔴🔵🔴🔵❓"),
  q("p-bintang", "pola", "Apa yang datang berikutnya? Bintang, bulan, bintang, bulan, ...", ["⭐", "🌙", "☀️"], "⭐", "⭐🌙⭐🌙❓"),
  q("p-kuninghijau", "pola", "Apa yang datang berikutnya? Kuning, hijau, kuning, hijau, ...", ["🟡", "🔴", "🔵"], "🟡", "🟡🟢🟡🟢❓"),
  q("p-beda-apel", "beda", "Mana yang berbeda dari yang lain?", ["🍎", "🚗", "🍌"], "🚗", "🍎🍎🚗🍎"),
  q("p-beda-kucing", "beda", "Mana yang berbeda dari yang lain?", ["🐱", "🐟", "🐶"], "🐟", "🐱🐱🐱🐟"),
  q("p-beda-bulan", "beda", "Mana yang berbeda dari yang lain?", ["🌙", "⭐", "☀️"], "⭐", "🌙🌙⭐🌙"),
  // Arah dan posisi
  q("d-kanan", "arah", "Panah mana yang menunjuk ke kanan?", ["⬅️", "➡️", "⬆️"], "➡️"),
  q("d-atas", "arah", "Panah mana yang menunjuk ke atas?", ["⬇️", "➡️", "⬆️"], "⬆️"),
  q("d-kiri", "arah", "Panah mana yang menunjuk ke kiri?", ["⬅️", "➡️", "⬇️"], "⬅️"),
  q("d-bawah", "arah", "Panah mana yang menunjuk ke bawah?", ["⬆️", "⬇️", "⬅️"], "⬇️"),
  q("d-kursi", "posisi", "Kucing ada di bawah kursi. Mana gambarnya?", ["🐱\n🪑", "🪑\n🐱"], "🪑\n🐱"),
  q("d-pohon", "posisi", "Burung ada di atas pohon. Mana gambarnya?", ["🐦\n🌳", "🌳\n🐦"], "🐦\n🌳"),
  // Jumlah dan hitung
  q("n-banyak", "jumlah", "Mana yang lebih banyak?", ["⭐⭐", "⭐⭐⭐⭐⭐"], "⭐⭐⭐⭐⭐"),
  q("n-banyak-apel", "jumlah", "Mana yang lebih banyak?", ["🍎", "🍎🍎🍎"], "🍎🍎🍎"),
  q("n-sedikit", "jumlah", "Mana yang lebih sedikit?", ["🐟🐟🐟🐟", "🐟🐟"], "🐟🐟"),
  q("n-tiga", "hitung", "Ada berapa apel?", ["2", "3", "4"], "3", "🍎🍎🍎"),
  q("n-lima", "hitung", "Ada berapa ikan?", ["4", "5", "6"], "5", "🐟🐟🐟🐟🐟"),
  q("n-dua", "hitung", "Ada berapa bintang?", ["1", "2", "3"], "2", "⭐⭐"),
  q("n-tambah", "tambah", "Dua ditambah satu jadi berapa?", ["2", "3", "4"], "3", "🍎🍎 ➕ 🍎"),
  q("n-kurang", "tambah", "Empat dikurang satu jadi berapa?", ["2", "3", "5"], "3", "🎈🎈🎈🎈 ➖ 🎈"),
  // Kebiasaan baik dan makanan
  q("k-cucitangan", "kebiasaan", "Sebelum makan, kita cuci tangan pakai apa?", ["🧼", "🧸", "🎈"], "🧼"),
  q("k-sampah", "kebiasaan", "Sampah dibuang ke mana?", ["🗑️", "🌊", "🛏️"], "🗑️"),
  q("k-sehat", "kebiasaan", "Mana yang sehat dimakan?", ["🍎", "🍭", "🍟"], "🍎"),
  q("f-pisang", "buah", "Mana buah pisang?", ["🍌", "🍎", "🍇"], "🍌"),
  q("f-sayur", "buah", "Mana sayur?", ["🥕", "🍎", "🍌"], "🥕"),
  // Huruf dan angka
  q("l-b", "huruf", "Mana huruf B?", ["D", "B", "P"], "B"),
  q("l-m", "huruf", "Mana huruf M?", ["N", "M", "W"], "M"),
  q("l-a", "huruf", "Mana huruf A?", ["A", "V", "H"], "A"),
  q("l-lima", "angka", "Mana angka lima?", ["2", "5", "7"], "5"),
  q("l-sembilan", "angka", "Mana angka sembilan?", ["6", "9", "8"], "9"),
];

const KEY = "belajar-ceria-quiz-seen";
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function readSeen(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Catat soal yang sudah dijawab benar supaya tidak muncul lagi sebelum semua soal pernah keluar. */
export function markSeen(id: string) {
  try {
    const s = readSeen();
    if (!s.includes(id)) localStorage.setItem(KEY, JSON.stringify([...s, id].slice(-300)));
  } catch {
    /* abaikan */
  }
}

/** Pilih n soal: utamakan yang belum pernah keluar, dan dari kategori yang berbeda-beda. */
export function pickQuestions(pool: QuizQ[], n: number): QuizQ[] {
  const seen = new Set(readSeen());
  let fresh = pool.filter((x) => !seen.has(x.id));
  if (fresh.length < n) {
    // Hampir semua soal sudah pernah keluar: mulai putaran baru.
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* abaikan */
    }
    fresh = pool;
  }
  const chosen: QuizQ[] = [];
  const cats = new Set<string>();
  for (const x of shuffle(fresh)) {
    if (chosen.length >= n) break;
    if (!cats.has(x.cat)) {
      chosen.push(x);
      cats.add(x.cat);
    }
  }
  for (const x of shuffle(fresh)) {
    if (chosen.length >= n) break;
    if (!chosen.includes(x)) chosen.push(x);
  }
  return chosen;
}
