import { describe, expect, it } from "vitest";
import { matchesTarget } from "@/lib/recognition";
import { lettersOnly } from "@/components/kid/Inputs";
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
