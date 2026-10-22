export type Activity =
  | { type: "tap"; prompt: string; options: string[]; answer: string }
  | { type: "drag"; prompt: string; item: string; target: string; distractor?: string }
  | { type: "choose"; prompt: string; options: string[]; answer: string };

export type StoryPage = { scene: string; text: string; activity?: Activity };
export type Story = {
  id: string;
  title: string;
  topic: string;
  emoji: string;
  level: 1 | 2 | 3;
  pages: StoryPage[];
};

export const STORIES: Story[] = [
  {
    id: "kancil-buaya",
    title: "Kancil dan Sungai",
    topic: "Fabel",
    emoji: "🦌",
    level: 1,
    pages: [
      {
        scene: "🦌🌳🌊",
        text: "Kancil ingin makan buah di seberang sungai.",
        activity: { type: "tap", prompt: "Ketuk si Kancil!", options: ["🐊", "🦌", "🐟"], answer: "🦌" },
      },
      {
        scene: "🐊🐊🐊🌊",
        text: "Ada banyak buaya di sungai. Kancil berpikir dengan tenang.",
        activity: { type: "choose", prompt: "Berapa buaya yang ada?", options: ["2", "3", "5"], answer: "3" },
      },
      {
        scene: "🦌🍎😊",
        text: "Kancil meminta buaya berbaris, lalu melompat dan menyeberang. Kancil cerdik!",
        activity: { type: "drag", prompt: "Tarik apel ke Kancil!", item: "🍎", target: "🦌", distractor: "🐊" },
      },
    ],
  },
  {
    id: "biji-kacang",
    title: "Biji Kecil Tumbuh",
    topic: "Tumbuhan & Sains",
    emoji: "🌱",
    level: 1,
    pages: [
      {
        scene: "🫘🟫",
        text: "Sebutir biji kacang ditanam di dalam tanah.",
        activity: { type: "drag", prompt: "Tarik biji ke dalam tanah!", item: "🫘", target: "🟫" },
      },
      {
        scene: "🌧️☀️🌱",
        text: "Biji butuh air hujan dan cahaya matahari supaya tumbuh.",
        activity: { type: "tap", prompt: "Ketuk yang membantu tanaman tumbuh!", options: ["🍭", "☀️", "🧸"], answer: "☀️" },
      },
      {
        scene: "🌿🌼",
        text: "Hari demi hari, biji tumbuh menjadi tanaman dengan bunga yang cantik.",
        activity: { type: "choose", prompt: "Biji tumbuh menjadi apa?", options: ["🚗", "🌼", "🐟"], answer: "🌼" },
      },
    ],
  },
  {
    id: "gempa",
    title: "Siaga Gempa Bersama Dika",
    topic: "Siaga Bencana",
    emoji: "🏫",
    level: 2,
    pages: [
      {
        scene: "🏫🧒📚",
        text: "Dika sedang belajar di kelas. Tiba tiba lantai bergoyang. Ada gempa!",
        activity: { type: "choose", prompt: "Apa yang terjadi?", options: ["🎉", "🌍", "🍦"], answer: "🌍" },
      },
      {
        scene: "🧒⬇️🪑",
        text: "Dika segera berlindung di bawah meja dan melindungi kepalanya. Jangan panik!",
        activity: { type: "drag", prompt: "Tarik Dika ke bawah meja!", item: "🧒", target: "🪑", distractor: "🪟" },
      },
      {
        scene: "🧒👩‍🏫🌳",
        text: "Setelah goyangan berhenti, Dika berjalan tertib ke lapangan terbuka bersama bu guru.",
        activity: { type: "tap", prompt: "Ketuk tempat yang aman setelah gempa!", options: ["🌳", "🪟", "🛗"], answer: "🌳" },
      },
    ],
  },
  {
    id: "hujan",
    title: "Dari Mana Datangnya Hujan?",
    topic: "Pengetahuan Umum",
    emoji: "🌧️",
    level: 2,
    pages: [
      {
        scene: "☀️🌊",
        text: "Matahari menghangatkan air laut. Air naik ke langit menjadi uap.",
        activity: { type: "tap", prompt: "Ketuk matahari!", options: ["🌙", "☀️", "⭐"], answer: "☀️" },
      },
      {
        scene: "☁️☁️",
        text: "Uap berkumpul menjadi awan. Awan makin berat dan gelap.",
        activity: { type: "drag", prompt: "Tarik uap air ke awan!", item: "💧", target: "☁️" },
      },
      {
        scene: "🌧️☂️",
        text: "Lalu air turun menjadi hujan. Jangan lupa bawa payung ya!",
        activity: { type: "choose", prompt: "Apa yang kita pakai saat hujan?", options: ["☂️", "🕶️", "🩴"], answer: "☂️" },
      },
    ],
  },
  {
    id: "dompet",
    title: "Rani dan Dompet yang Jatuh",
    topic: "Cerita Hikmah",
    emoji: "👛",
    level: 3,
    pages: [
      {
        scene: "👧🛝👛",
        text: "Saat bermain di taman, Rani menemukan sebuah dompet di bawah ayunan.",
        activity: { type: "tap", prompt: "Ketuk dompet yang ditemukan Rani!", options: ["⚽", "👛", "🧃"], answer: "👛" },
      },
      {
        scene: "👧🤔👵",
        text: "Rani melihat seorang nenek yang sedang bingung mencari sesuatu.",
        activity: { type: "drag", prompt: "Bantu Rani mengembalikan dompet ke nenek!", item: "👛", target: "👵", distractor: "🗑️" },
      },
      {
        scene: "👵😊👧",
        text: "Nenek tersenyum dan berterima kasih. Rani senang karena berbuat jujur.",
        activity: { type: "choose", prompt: "Bagaimana sikap Rani?", options: ["😊 Jujur", "😠 Marah", "😴 Malas"], answer: "😊 Jujur" },
      },
    ],
  },
  {
    id: "semut-gajah",
    title: "Semut Kecil Penolong",
    topic: "Fabel",
    emoji: "🐜",
    level: 3,
    pages: [
      {
        scene: "🐘🌳🐜",
        text: "Gajah besar sering mengejek semut karena tubuhnya kecil sekali.",
        activity: { type: "choose", prompt: "Mana yang lebih besar?", options: ["🐜", "🐘"], answer: "🐘" },
      },
      {
        scene: "🐘😣🌿",
        text: "Suatu hari, kaki gajah tersangkut tali pemburu. Gajah tidak bisa bergerak.",
        activity: { type: "tap", prompt: "Ketuk gajah yang sedang sedih!", options: ["🐘", "🐒", "🦒"], answer: "🐘" },
      },
      {
        scene: "🐜🐜🐜🐘",
        text: "Semut semut datang dan menggigit tali sampai putus. Gajah bebas dan meminta maaf.",
        activity: { type: "drag", prompt: "Tarik semut ke tali!", item: "🐜", target: "🪢" },
      },
    ],
  },
  {
    id: "kura-kelinci",
    title: "Kura-kura dan Kelinci",
    topic: "Fabel",
    emoji: "🐢",
    level: 1,
    pages: [
      {
        scene: "🐰🐢🏁",
        text: "Kelinci dan Kura kura mau lomba lari.",
        activity: { type: "tap", prompt: "Ketuk si Kura kura!", options: ["🐰", "🐢", "🐦"], answer: "🐢" },
      },
      {
        scene: "🐰💤🌳",
        text: "Kelinci berlari sangat cepat. Lalu dia tidur siang di bawah pohon.",
        activity: { type: "choose", prompt: "Kelinci sedang apa?", options: ["😴", "🍔", "⚽"], answer: "😴" },
      },
      {
        scene: "🐢🏁🎉",
        text: "Kura kura berjalan pelan tapi tidak berhenti. Dia sampai lebih dulu! Rajin itu hebat.",
        activity: { type: "drag", prompt: "Tarik piala ke Kura kura!", item: "🏆", target: "🐢", distractor: "🐰" },
      },
    ],
  },
  {
    id: "cuci-tangan",
    title: "Ayo Cuci Tangan",
    topic: "Hidup Sehat",
    emoji: "🧼",
    level: 1,
    pages: [
      {
        scene: "🧒🍽️🦠",
        text: "Sebelum makan, Adi mencuci tangan dulu.",
        activity: { type: "tap", prompt: "Ketuk yang dipakai untuk cuci tangan!", options: ["🧼", "🍭", "⚽"], answer: "🧼" },
      },
      {
        scene: "🧒🖐️🫧",
        text: "Adi menggosok tangan dengan sabun sampai berbusa.",
        activity: { type: "drag", prompt: "Tarik sabun ke tangan Adi!", item: "🧼", target: "🖐️", distractor: "🧸" },
      },
      {
        scene: "🧒🍚😋",
        text: "Tangan sudah bersih. Adi makan dengan sehat dan senang.",
        activity: { type: "choose", prompt: "Cuci tangan sebelum apa?", options: ["🍽️", "📺", "🎈"], answer: "🍽️" },
      },
    ],
  },
  {
    id: "sungai-bersih",
    title: "Sinta Menjaga Sungai",
    topic: "Peduli Lingkungan",
    emoji: "🌊",
    level: 2,
    pages: [
      {
        scene: "👧🍬🗑️",
        text: "Sinta selesai makan permen. Bungkusnya mau dibuang ke mana?",
        activity: { type: "drag", prompt: "Tarik bungkus ke tempat sampah!", item: "🍬", target: "🗑️", distractor: "🌊" },
      },
      {
        scene: "🌊🗑️🐟",
        text: "Kalau sampah dibuang ke sungai, sungai jadi kotor dan ikan bisa sakit.",
        activity: { type: "choose", prompt: "Siapa yang sakit kalau sungai kotor?", options: ["🐟", "🚗", "🪁"], answer: "🐟" },
      },
      {
        scene: "👧🌳✨",
        text: "Sinta membuang sampah pada tempatnya. Sungai bersih dan ikan senang.",
        activity: { type: "tap", prompt: "Ketuk tempat sampah!", options: ["🗑️", "🎒", "🍎"], answer: "🗑️" },
      },
    ],
  },
  {
    id: "siang-malam",
    title: "Kenapa Ada Siang dan Malam?",
    topic: "Pengetahuan Umum",
    emoji: "🌍",
    level: 2,
    pages: [
      {
        scene: "🌍☀️",
        text: "Bumi berputar pelan pelan. Bagian bumi yang terkena sinar matahari menjadi siang.",
        activity: { type: "tap", prompt: "Ketuk matahari!", options: ["🌙", "☀️", "⭐"], answer: "☀️" },
      },
      {
        scene: "🌍🌙⭐",
        text: "Bagian bumi yang membelakangi matahari menjadi malam. Kita bisa melihat bulan dan bintang.",
        activity: { type: "choose", prompt: "Apa yang terlihat di malam hari?", options: ["🌙", "🌈", "🏖️"], answer: "🌙" },
      },
      {
        scene: "🛌😴🌙",
        text: "Malam hari waktunya tidur. Badan kita beristirahat supaya sehat dan kuat.",
        activity: { type: "tap", prompt: "Ketuk yang dipakai untuk tidur!", options: ["🛌", "⚽", "🚲"], answer: "🛌" },
      },
    ],
  },
  {
    id: "berbagi-mainan",
    title: "Budi Mau Berbagi",
    topic: "Cerita Hikmah",
    emoji: "🚗",
    level: 3,
    pages: [
      {
        scene: "👦🚗🧒",
        text: "Budi punya banyak mobil mainan. Teman barunya, Eko, tidak punya mainan.",
        activity: { type: "choose", prompt: "Ada berapa anak dalam cerita?", options: ["1", "2", "3"], answer: "2" },
      },
      {
        scene: "👦🚗🧒",
        text: "Budi meminjamkan satu mobil pada Eko. Mereka bermain bersama.",
        activity: { type: "drag", prompt: "Tarik mobil ke Eko!", item: "🚗", target: "🧒", distractor: "🐶" },
      },
      {
        scene: "😊😊🚗",
        text: "Bermain bersama lebih seru. Berbagi membuat hati senang.",
        activity: { type: "tap", prompt: "Ketuk wajah yang senang!", options: ["😢", "😊", "😠"], answer: "😊" },
      },
    ],
  },
  {
    id: "kupu-kupu",
    title: "Dari Ulat Menjadi Kupu-kupu",
    topic: "Tumbuhan & Sains",
    emoji: "🦋",
    level: 3,
    pages: [
      {
        scene: "🥚🍃",
        text: "Induk kupu kupu bertelur di atas daun.",
        activity: { type: "tap", prompt: "Ketuk telurnya!", options: ["🥚", "🍎", "🪨"], answer: "🥚" },
      },
      {
        scene: "🐛🍃",
        text: "Telur menetas menjadi ulat. Ulat makan daun banyak sekali.",
        activity: { type: "choose", prompt: "Ulat makan apa?", options: ["🍃", "🍕", "🪨"], answer: "🍃" },
      },
      {
        scene: "🐛💤🍂",
        text: "Setelah besar, ulat membuat kepompong dan beristirahat di dalamnya.",
      },
      {
        scene: "🦋🌸",
        text: "Kepompong terbuka. Keluarlah kupu kupu cantik yang terbang di antara bunga!",
        activity: { type: "drag", prompt: "Tarik kupu kupu ke bunga!", item: "🦋", target: "🌸", distractor: "🪨" },
      },
    ],
  },
];

export const storyForLetter = (index: number) => {
  // Graded: early letters get level 1 stories, later letters harder ones; topics mixed.
  const level = index < 9 ? 1 : index < 18 ? 2 : 3;
  const pool = STORIES.filter((s) => s.level === level);
  return pool[index % pool.length];
};
