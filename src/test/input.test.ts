import { describe, expect, it } from "vitest";
import { matchesTarget } from "@/lib/recognition";
import { assistFor, lettersOnly } from "@/components/kid/Inputs";
import { LETTERS, drillWords } from "@/data/letters";
import { THEMES } from "@/data/english";
import { SHAPES, SHAPE_OBJECTS, TYPEABLE } from "@/data/shapes";

describe("matchesTarget", () => {
  it("menerima ucapan yang sama atau hampir sama", () => {
    expect(matchesTarget(["bola"], "Bola")).toBe(true);
    expect(matchesTarget(["i love banana"], "banana")).toBe(true);
    expect(matchesTarget(["elefant"], "elephant")).toBe(true);
  });
  it("menolak ucapan yang berbeda", () => {
    expect(matchesTarget(["kucing"], "bola")).toBe(false);
    expect(matchesTarget(["cat"], "cow")).toBe(false);
    expect(matchesTarget([], "bola")).toBe(false);
  });
});

describe("matchesTarget kata pendek", () => {
  it("kata pendek tidak cocok hanya karena ada di dalam kata lain", () => {
    expect(matchesTarget(["besar"], "es")).toBe(false);
    expect(matchesTarget(["es"], "es")).toBe(true);
    expect(matchesTarget(["aku mau es"], "es")).toBe(true);
  });
  it("kata tiga huruf boleh selisih satu huruf asal huruf depan sama", () => {
    expect(matchesTarget(["jan"], "jam")).toBe(true);
    expect(matchesTarget(["ibi"], "ibu")).toBe(true);
    expect(matchesTarget(["tam"], "jam")).toBe(false);
  });
});

describe("assistFor", () => {
  it("bantuan memudar: salin, huruf pertama, ingatan", () => {
    expect([0, 1, 2].map((i) => assistFor(i, 3))).toEqual(["copy", "first", "none"]);
    expect([0, 1, 2, 3, 4].map((i) => assistFor(i, 5))).toEqual(["copy", "copy", "first", "first", "none"]);
  });
});

describe("drillWords", () => {
  it("memilih kata pendek, satu kata, dengan gambar yang jelas", () => {
    for (const l of LETTERS) {
      const picks = drillWords(l.words, 3);
      expect(picks.length).toBe(Math.min(3, l.words.length));
      expect(picks[0].id).toBeTruthy();
    }
    const c = drillWords(LETTERS.find((l) => l.letter === "C")!.words).map((w) => w.id);
    expect(c).not.toContain("Cumi-cumi");
    const a = drillWords(LETTERS.find((l) => l.letter === "A")!.words).map((w) => w.id);
    expect(a).not.toContain("Anggur");
  });
});

describe("lettersOnly", () => {
  it("membuang spasi dan tanda hubung", () => {
    expect(lettersOnly("Cumi-cumi")).toBe("cumicumi");
    expect(lettersOnly("ice cream")).toBe("icecream");
  });
});

describe("data", () => {
  it("tiap tema Inggris punya cukup kata dan tidak ada kata kosong", () => {
    for (const t of THEMES) {
      expect(t.words.length).toBeGreaterThanOrEqual(4);
      for (const w of t.words) expect(w.en && w.id && w.emoji).toBeTruthy();
    }
  });
  it("bentuk yang bisa diketik dan soal benda ada di daftar bentuk", () => {
    const ids = SHAPES.map((s) => s.id);
    TYPEABLE.forEach((id) => expect(ids).toContain(id));
    SHAPE_OBJECTS.forEach((o) => expect(ids).toContain(o.shape));
  });
});
