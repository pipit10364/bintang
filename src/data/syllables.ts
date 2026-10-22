// Pemecah kata menjadi suku kata (ejaan Indonesia).
// Heuristik V-KV dengan penanganan konsonan berpasangan (ng, ny, sy, kh, ch).
const V = "aiueo";
const DIGRAPHS = ["ny", "ng", "sy", "kh", "ch"];

/** Pengecualian untuk kata yang tidak cocok dengan aturan umum. */
const OVERRIDE: Record<string, string[]> = {
  violin: ["vi", "o", "lin"],
};

type Unit = { t: "c"; s: string } | { t: "v"; s: string };

/** Pecah bagian kata (tanpa spasi/Hubung) menjadi satuan konsonan dan deret vokal. */
function units(part: string): Unit[] {
  const out: Unit[] = [];
  let i = 0;
  while (i < part.length) {
    const two = part.slice(i, i + 2).toLowerCase();
    if (DIGRAPHS.includes(two)) {
      out.push({ t: "c", s: part.slice(i, i + 2) });
      i += 2;
    } else if (V.includes(part[i].toLowerCase())) {
      let j = i;
      while (j < part.length && V.includes(part[j].toLowerCase())) j++;
      out.push({ t: "v", s: part.slice(i, j) });
      i = j;
    } else {
      out.push({ t: "c", s: part[i] });
      i += 1;
    }
  }
  return out;
}

function syllabifyPart(part: string): string[] {
  const toks = units(part);
  const out: string[] = [];
  let cur = "";
  for (let k = 0; k < toks.length; k++) {
    const tok = toks[k];
    if (tok.t === "v") {
      cur += tok.s;
      continue;
    }
    const next = toks[k + 1];
    if (!next || next.t === "c") {
      // Konsonan di akhir kata atau sebelum konsonan lain: menempel di suku kata ini.
      cur += tok.s;
      continue;
    }
    // Konsonan sebelum vokal: menjadi awal suku kata berikutnya.
    if (!cur) {
      cur = tok.s;
    } else if (tok.s.length === 1) {
      out.push(cur);
      cur = tok.s;
    } else {
      // Klaster: konsonan terakhir membuka suku kata baru, sisanya menutup yang ini.
      cur += tok.s.slice(0, -1);
      out.push(cur);
      cur = tok.s.slice(-1);
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Pecah kata menjadi suku kata, mis. "bola" → ["bo","la"], "apel" → ["a","pel"]. */
export function syllabify(word: string): string[] {
  const key = word.toLowerCase();
  if (OVERRIDE[key]) return OVERRIDE[key];
  const parts = key.split(/[\s-]+/).filter(Boolean);
  return parts.flatMap((p) => syllabifyPart(p));
}

/** Keluarga suku kata untuk satu huruf: konsonan → ba be bi bo bu; vokal → kelima vokal. */
export function syllableFamily(letter: string): string[] {
  const l = letter.toLowerCase();
  if (V.includes(l)) return ["a", "i", "u", "e", "o"];
  return ["a", "i", "u", "e", "o"].map((v) => l + v);
}
