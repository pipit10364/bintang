import { describe, expect, it } from "vitest";
import { codeColors, codePictures, letterSequence, nearOptions, pickBlanks, sumPairs, syllableQuiz, wordPairs } from "@/lib/latihan";
import { makeMathQuestion } from "@/components/kid/Activities";

describe("latihan", () => {
  it("pengurangan tidak pernah menghasilkan 0", () => {
    for (let i = 0; i < 500; i++) {
      const q = makeMathQuestion(0.1);
      expect(q.plus).toBe(false);
      expect(q.res).toBeGreaterThanOrEqual(1);
      expect(q.res).toBe(q.a - q.b);
    }
  });
  it("soal valid", () => {
    for (let i = 0; i < 100; i++) {
      expect(new Set(sumPairs().map((p) => p.right)).size).toBe(5);
      expect(wordPairs().every((p) => p.left.replace(/ /g, "") === p.right)).toBe(true);
      for (const q of [...codePictures().questions, ...codeColors().questions]) {
        expect(q.options).toContain(q.answer);
        expect(q.options.every((o) => o >= 1)).toBe(true);
      }
      const s = letterSequence(["b", "d", "p", "q"]);
      expect(s.every((l, k) => k === 0 || l !== s[k - 1])).toBe(true);
      expect(new Set(pickBlanks(8)).size).toBe(8);
      expect(syllableQuiz().every((x) => new Set(x.options).size === 4 && x.options.includes(x.target))).toBe(true);
    }
    expect(nearOptions(1).every((n) => n >= 1)).toBe(true);
  });
});
