import { describe, expect, it } from "vitest";
import { syllabify, syllableFamily } from "@/data/syllables";

describe("pemecah suku kata", () => {
  it("memecah pola V-KV dan KVKV", () => {
    expect(syllabify("bola")).toEqual(["bo", "la"]);
    expect(syllabify("apel")).toEqual(["a", "pel"]);
    expect(syllabify("ikan")).toEqual(["i", "kan"]);
  });
  it("menangani klaster konsonan dan konsonan berpasangan", () => {
    expect(syllabify("nyamuk")).toEqual(["nya", "muk"]);
    expect(syllabify("anggur")).toEqual(["ang", "gur"]);
    expect(syllabify("harga")).toEqual(["har", "ga"]);
    expect(syllabify("kupu-kupu")).toEqual(["ku", "pu", "ku", "pu"]);
  });
  it("huruf vokal memakai kelima vokal sebagai keluarga suku kata", () => {
    expect(syllableFamily("A")).toEqual(["a", "i", "u", "e", "o"]);
    expect(syllableFamily("B")).toEqual(["ba", "bi", "bu", "be", "bo"]);
  });
});
