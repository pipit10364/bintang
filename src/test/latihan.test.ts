import { describe, expect, it } from "vitest";
import {
  APPLE_LEVELS, CIRCLE_LEVELS, LEVELS, appleLevel, blankCount, circleCells, circleLevel, codeColors, codePictures,
  fillDots, idNum, letterSequence, mathPairs, nearOptions, pickBlanks, pickTargets, syllableQuiz, tableRows, wordPairs,
} from "@/lib/latihan";
import { makeMathQuestion } from "@/components/kid/Activities";
import { ttsText } from "@/lib/speech";

const levels = Array.from({ length: LEVELS }, (_, i) => i + 1);

describe("pengurangan", () => {
  it("tidak pernah menghasilkan 0", () => {
    for (let i = 0; i < 500; i++) {
      const q = makeMathQuestion(0.1);
      expect(q.plus).toBe(false);
      expect(q.res).toBeGreaterThanOrEqual(1);
      expect(q.res).toBe(q.a - q.b);
    }
  });
});

describe("ejaan suku kata", () => {
  it("e dan o dibaca Indonesia", () => {
    expect(ttsText("me", "id-ID", true)).toBe("meh");
    expect(ttsText("to, to, to", "id-ID", true)).toBe("toh, toh, toh");
    expect(ttsText("hi", "id-ID", true)).toBe("hii");
    expect(ttsText("ba", "id-ID", true)).toBe("ba");
    expect(ttsText("nyo", "id-ID", true)).toBe("nyoh");
  });
});

describe("10 level per tema", () => {
  it("angka dalam kata", () => {
    expect([idNum(7), idNum(11), idNum(15), idNum(20), idNum(36)]).toEqual(["tujuh", "sebelas", "lima belas", "dua puluh", "tiga puluh enam"]);
  });
  it("hitungan valid dan tidak pernah 0", () => {
    for (const l of levels)
      for (let i = 0; i < 100; i++) {
        const p = mathPairs(l);
        expect(new Set(p.map((x) => x.right)).size).toBe(p.length);
        expect(p.every((x) => +x.right >= 1)).toBe(true);
        if (l < 6) expect(p.every((x) => x.left.includes("+"))).toBe(true);
      }
  });
  it("suku kata dan kata cocok", () => {
    for (const l of levels)
      for (let i = 0; i < 50; i++) {
        const p = wordPairs(l);
        expect(p.length).toBe(l <= 2 ? 3 : l <= 5 ? 4 : 5);
        expect(new Set(p.map((x) => x.right)).size).toBe(p.length);
        expect(p.every((x) => x.left.replace(/ /g, "") === x.right)).toBe(true);
      }
  });
  it("coding", () => {
    for (const l of levels)
      for (let i = 0; i < 100; i++)
        for (const g of [codePictures(l), codeColors(l)]) {
          expect(new Set(g.legend.map((s) => s.value)).size).toBe(g.legend.length);
          for (const q of g.questions) {
            expect(q.answer).toBe(q.syms.reduce((t, s) => t + s.value, 0));
            expect(q.options).toContain(q.answer);
            expect(new Set(q.options).size).toBe(q.options.length);
            expect(q.options.every((o) => o >= 1)).toBe(true);
          }
        }
  });
  it("apel dan lingkari", () => {
    expect(APPLE_LEVELS.length).toBe(LEVELS);
    expect(CIRCLE_LEVELS.length).toBe(LEVELS);
    for (const l of levels) {
      const a = appleLevel(l);
      const seq = letterSequence(a.group, a.rounds);
      expect(seq.every((x, k) => k === 0 || x !== seq[k - 1])).toBe(true);
      const c = circleLevel(l);
      const t = pickTargets(c.pool, c.rounds);
      expect(t.length).toBe(c.rounds);
      expect(t.every((x, k) => k === 0 || x !== t[k - 1])).toBe(true);
      for (const target of t) {
        const cells = circleCells(c.pool, target, c.cells, c.hits);
        expect(cells.length).toBe(c.cells);
        expect(cells.filter((x) => x === target).length).toBe(c.hits);
      }
    }
  });
  it("abjad bertambah sulit", () => {
    expect(blankCount(1)).toBeLessThan(blankCount(10));
    expect(new Set(pickBlanks(blankCount(10))).size).toBe(blankCount(10));
  });
  it("tabel suku kata menutup 19 konsonan", () => {
    expect(new Set(levels.flatMap((l) => tableRows(l)))).toEqual(new Set("bcdfghjklmnprstvwyz".split("")));
  });
  it("dengar suku kata", () => {
    for (const l of levels)
      for (let i = 0; i < 100; i++)
        for (const q of syllableQuiz(l)) {
          expect(q.options).toContain(q.target);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBe(l <= 2 ? 2 : l <= 4 ? 3 : 4);
        }
  });
  it("isi titik", () => {
    for (const l of levels)
      for (let i = 0; i < 100; i++)
        for (const q of fillDots(l)) {
          if (q.kind === "v") expect(q.options).toContain(q.target[1]);
          if (q.kind === "c" || q.kind === "both") expect(q.options).toContain(q.target[0]);
          if (q.kind === "both") expect(q.options2).toContain(q.target[1]);
          if (q.kind === "tree") expect(q.options.length).toBe(5);
          expect(new Set(q.options).size).toBe(q.options.length);
        }
  });
  it("pilihan angka dekat jawaban", () => {
    expect(nearOptions(1).every((n) => n >= 1)).toBe(true);
    expect(nearOptions(10, 4).length).toBe(4);
  });
});
