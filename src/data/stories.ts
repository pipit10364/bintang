export type Activity =
  | { type: "tap"; prompt: string; options: string[]; answer: string }
  | { type: "drag"; prompt: string; item: string; target: string; distractor?: string }
  | { type: "choose"; prompt: string; options: string[]; answer: string }
  | { type: "count"; prompt: string; items: string[] }
  | { type: "sort"; prompt: string; item: string; good: { emoji: string; label: string }; bad: { emoji: string; label: string } };

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
        activity: {
          type: "sort",
          prompt: "Bantu Rani memilah: ke mana dompet itu diserahkan?",
          item: "👛",
          good: { emoji: "👵", label: "Kembalikan ke Nenek" },
          bad: { emoji: "🗑️", label: "Dibuang" },
        },
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
        activity: {
          type: "sort",
          prompt: "Pilah bungkus permen ke tempat yang benar!",
          item: "🍬",
          good: { emoji: "🗑️", label: "Tempat sampah" },
          bad: { emoji: "🌊", label: "Sungai" },
        },
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
  {
    id: "gajah",
    title: "Mengenal Gajah",
    topic: "Mengenal Hewan",
    emoji: "🐘",
    level: 1,
    pages: [
      {
        scene: "🐘🌳",
        text: "Gajah adalah hewan darat yang sangat besar. Badannya berwarna abu abu.",
        activity: { type: "tap", prompt: "Ketuk si Gajah!", options: ["🐘", "🐇", "🐦"], answer: "🐘" },
      },
      {
        scene: "🐘🌿💧",
        text: "Gajah punya belalai yang panjang. Belalai dipakai untuk minum, mengambil makanan, dan menyapa teman.",
        activity: { type: "tap", prompt: "Ketuk makanan gajah!", options: ["🌿", "🍔", "🍫"], answer: "🌿" },
      },
      {
        scene: "🐘🐘🐘",
        text: "Gajah hidup berkelompok bersama keluarganya. Gajah kecil dijaga oleh gajah besar.",
        activity: { type: "count", prompt: "Ayo hitung gajahnya satu per satu!", items: ["🐘", "🐘", "🐘"] },
      },
    ],
  },
  {
    id: "kucing",
    title: "Mengenal Kucing",
    topic: "Mengenal Hewan",
    emoji: "🐱",
    level: 1,
    pages: [
      {
        scene: "🐱🏠",
        text: "Kucing adalah hewan peliharaan. Badannya berbulu halus dan lembut.",
        activity: { type: "tap", prompt: "Ketuk si Kucing!", options: ["🐶", "🐱", "🐰"], answer: "🐱" },
      },
      {
        scene: "🐱🐟",
        text: "Kucing suka makan ikan. Kucing juga pandai menangkap tikus.",
        activity: { type: "tap", prompt: "Ketuk makanan kucing!", options: ["🐟", "🥕", "🍌"], answer: "🐟" },
      },
      {
        scene: "🐱💤",
        text: "Kucing bersuara miau. Kucing juga suka tidur siang yang lama.",
        activity: { type: "choose", prompt: "Kucing sedang apa?", options: ["😴", "🏃", "🍽️"], answer: "😴" },
      },
    ],
  },
  {
    id: "matahari",
    title: "Mengenal Matahari",
    topic: "Mengenal Langit",
    emoji: "☀️",
    level: 1,
    pages: [
      {
        scene: "☀️☁️",
        text: "Matahari adalah bintang yang besar dan sangat panas. Matahari terlihat di langit pada siang hari.",
        activity: { type: "tap", prompt: "Ketuk matahari!", options: ["☀️", "🌙", "☁️"], answer: "☀️" },
      },
      {
        scene: "☀️🌱",
        text: "Matahari memberi kita cahaya dan rasa hangat. Tanaman juga butuh cahaya matahari supaya tumbuh.",
        activity: { type: "choose", prompt: "Siapa yang butuh cahaya matahari?", options: ["🌱", "🪨", "🧱"], answer: "🌱" },
      },
      {
        scene: "☀️🧢",
        text: "Kalau cuaca panas, kita memakai topi dan minum air putih. Jangan menatap matahari langsung ya.",
        activity: { type: "tap", prompt: "Ketuk topi!", options: ["🧢", "🧦", "🧤"], answer: "🧢" },
      },
    ],
  },
  {
    id: "burung",
    title: "Mengenal Burung",
    topic: "Mengenal Hewan",
    emoji: "🐦",
    level: 1,
    pages: [
      {
        scene: "🐦☁️",
        text: "Burung punya sayap dan bulu. Burung bisa terbang tinggi di langit.",
        activity: { type: "tap", prompt: "Ketuk hewan yang bisa terbang!", options: ["🐦", "🐢", "🐄"], answer: "🐦" },
      },
      {
        scene: "🪹🥚",
        text: "Burung bertelur. Telurnya dijaga hangat di dalam sarang.",
        activity: { type: "choose", prompt: "Burung bertelur di mana?", options: ["🪹", "🌊", "🚗"], answer: "🪹" },
      },
      {
        scene: "🐦🐦🐦🐦",
        text: "Burung berkicau di pagi hari. Cip cip cip! Burung hidup bersama teman temannya.",
        activity: { type: "count", prompt: "Ayo hitung burungnya satu per satu!", items: ["🐦", "🐦", "🐦", "🐦"] },
      },
    ],
  },
  {
    id: "bulan",
    title: "Mengenal Bulan",
    topic: "Mengenal Langit",
    emoji: "🌙",
    level: 2,
    pages: [
      {
        scene: "🌙⭐",
        text: "Bulan terlihat di langit pada malam hari. Bentuknya bisa berubah ubah, kadang bulat, kadang sabit.",
        activity: { type: "tap", prompt: "Ketuk bulan!", options: ["🌙", "☀️", "🌈"], answer: "🌙" },
      },
      {
        scene: "🌙☀️",
        text: "Bulan tidak punya cahaya sendiri. Bulan memantulkan cahaya matahari, jadi malam tidak terlalu gelap.",
        activity: { type: "choose", prompt: "Cahaya bulan berasal dari mana?", options: ["☀️", "🔥", "💡"], answer: "☀️" },
      },
      {
        scene: "🧑‍🚀🚀🌙",
        text: "Ada astronot yang pernah pergi ke bulan naik roket. Astronot memakai baju khusus.",
        activity: { type: "drag", prompt: "Tarik astronot ke roket!", item: "🧑‍🚀", target: "🚀", distractor: "🚗" },
      },
    ],
  },
  {
    id: "bintang",
    title: "Bintang di Langit",
    topic: "Mengenal Langit",
    emoji: "⭐",
    level: 2,
    pages: [
      {
        scene: "🌌⭐",
        text: "Pada malam yang cerah, kita bisa melihat banyak bintang di langit. Bintang bersinar sendiri.",
        activity: { type: "tap", prompt: "Ketuk bintang!", options: ["⭐", "🍎", "🔔"], answer: "⭐" },
      },
      {
        scene: "☀️⭐",
        text: "Matahari juga sebuah bintang. Bintang lain terlihat kecil karena letaknya sangat jauh.",
        activity: { type: "choose", prompt: "Matahari juga sebuah apa?", options: ["⭐", "🌙", "☁️"], answer: "⭐" },
      },
      {
        scene: "🌙⭐🛌",
        text: "Bintang terlihat saat malam hari. Di siang hari bintang tidak terlihat karena cahaya matahari sangat terang.",
        activity: { type: "choose", prompt: "Kapan kita bisa melihat bintang?", options: ["🌙", "☀️"], answer: "🌙" },
      },
    ],
  },
  {
    id: "lebah",
    title: "Mengenal Lebah",
    topic: "Mengenal Hewan",
    emoji: "🐝",
    level: 2,
    pages: [
      {
        scene: "🐝🌼",
        text: "Lebah kecil dan bisa terbang. Badannya bergaris kuning dan hitam.",
        activity: { type: "tap", prompt: "Ketuk si Lebah!", options: ["🐝", "🐜", "🐞"], answer: "🐝" },
      },
      {
        scene: "🐝🌸",
        text: "Lebah mengisap sari bunga. Dari sari bunga itu, lebah membuat madu.",
        activity: { type: "drag", prompt: "Tarik lebah ke bunga!", item: "🐝", target: "🌸", distractor: "🪨" },
      },
      {
        scene: "🐝🐝🍯",
        text: "Lebah hidup bersama banyak teman di sarangnya. Mereka rajin bekerja sama.",
        activity: { type: "choose", prompt: "Lebah membuat apa?", options: ["🍯", "🍕", "🍦"], answer: "🍯" },
      },
    ],
  },
  {
    id: "ikan",
    title: "Hewan di Dalam Air",
    topic: "Mengenal Hewan",
    emoji: "🐟",
    level: 2,
    pages: [
      {
        scene: "🐟🌊",
        text: "Ikan hidup di dalam air. Ikan berenang dengan sirip dan ekornya.",
        activity: { type: "tap", prompt: "Ketuk si Ikan!", options: ["🐟", "🐔", "🐑"], answer: "🐟" },
      },
      {
        scene: "🐠💧",
        text: "Ikan bernapas di dalam air memakai insang. Ada ikan yang kecil dan ada yang besar.",
        activity: { type: "choose", prompt: "Ikan hidup di mana?", options: ["💧", "🌳", "🏜️"], answer: "💧" },
      },
      {
        scene: "🐳🌊",
        text: "Paus adalah hewan laut yang paling besar. Badannya lebih besar dari kapal kecil.",
        activity: { type: "tap", prompt: "Ketuk paus!", options: ["🐳", "🐟", "🦀"], answer: "🐳" },
      },
    ],
  },
  {
    id: "tata-surya",
    title: "Mengenal Tata Surya",
    topic: "Mengenal Langit",
    emoji: "🪐",
    level: 3,
    pages: [
      {
        scene: "🌍☀️",
        text: "Bumi adalah tempat tinggal kita. Bumi berputar mengelilingi matahari.",
        activity: { type: "tap", prompt: "Ketuk Bumi!", options: ["🌍", "🌙", "☀️"], answer: "🌍" },
      },
      {
        scene: "☀️🌍🪐",
        text: "Ada delapan planet yang mengelilingi matahari. Bumi adalah salah satunya.",
        activity: { type: "choose", prompt: "Ada berapa planet?", options: ["4", "8", "12"], answer: "8" },
      },
      {
        scene: "🪐✨",
        text: "Planet Saturnus punya cincin yang indah di sekelilingnya.",
        activity: { type: "tap", prompt: "Ketuk Saturnus!", options: ["🪐", "🌍", "🌙"], answer: "🪐" },
      },
    ],
  },
  {
    id: "pelangi",
    title: "Mengenal Pelangi",
    topic: "Mengenal Langit",
    emoji: "🌈",
    level: 3,
    pages: [
      {
        scene: "🌧️☀️🌈",
        text: "Pelangi muncul di langit setelah hujan, saat matahari bersinar.",
        activity: { type: "tap", prompt: "Ketuk pelangi!", options: ["🌈", "☁️", "⚡"], answer: "🌈" },
      },
      {
        scene: "🌈🎨",
        text: "Warna pelangi ada tujuh. Ada merah, jingga, kuning, hijau, biru, nila, dan ungu.",
        activity: { type: "choose", prompt: "Ada berapa warna pelangi?", options: ["5", "7", "9"], answer: "7" },
      },
      {
        scene: "💧☀️🌈",
        text: "Pelangi terbentuk dari cahaya matahari dan tetes air hujan. Pelangi indah, tapi tidak bisa disentuh.",
        activity: { type: "choose", prompt: "Pelangi muncul setelah apa?", options: ["🌧️", "🌙", "❄️"], answer: "🌧️" },
      },
    ],
  },
  {
    id: "kendaraan",
    title: "Mengenal Kendaraan",
    topic: "Mengenal Benda",
    emoji: "🚗",
    level: 3,
    pages: [
      {
        scene: "🚗🛣️",
        text: "Mobil berjalan di jalan raya. Mobil punya empat roda.",
        activity: { type: "choose", prompt: "Berapa roda mobil?", options: ["2", "4", "6"], answer: "4" },
      },
      {
        scene: "🚢🌊",
        text: "Kapal berlayar di laut. Pesawat terbang di langit.",
        activity: {
          type: "sort",
          prompt: "Pilah kapal ke tempat yang benar!",
          item: "🚢",
          good: { emoji: "🌊", label: "Laut" },
          bad: { emoji: "☁️", label: "Langit" },
        },
      },
      {
        scene: "🚆🛤️",
        text: "Kereta api berjalan di atas rel. Kereta api bisa membawa banyak penumpang.",
        activity: { type: "tap", prompt: "Ketuk kereta api!", options: ["🚆", "🚲", "🛵"], answer: "🚆" },
      },
    ],
  },
  {
    id: "tubuhku",
    title: "Tubuhku Hebat",
    topic: "Mengenal Tubuh",
    emoji: "🧒",
    level: 3,
    pages: [
      {
        scene: "🧒👁️",
        text: "Kita punya lima indra. Mata untuk melihat, telinga untuk mendengar.",
        activity: { type: "tap", prompt: "Ketuk mata!", options: ["👁️", "👂", "👃"], answer: "👁️" },
      },
      {
        scene: "🧒👂👃",
        text: "Hidung untuk mencium bau. Lidah untuk merasakan makanan.",
        activity: { type: "tap", prompt: "Ketuk telinga!", options: ["👂", "👃", "👅"], answer: "👂" },
      },
      {
        scene: "🧒🤲👅",
        text: "Tangan dan kulit untuk meraba. Terima kasih, tubuhku yang hebat!",
        activity: { type: "tap", prompt: "Ketuk lidah!", options: ["👅", "👁️", "👂"], answer: "👅" },
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
