import { describe, expect, it } from "vitest";
import { dilate, floodMask, gradientPixels, hexToHsv, hexToRgb, hsvToHex, rgbToHex } from "@/lib/paint-utils";

// Kertas putih 40x40 dengan bingkai hitam: ruang putih di dalam bingkai ada 16x16 piksel.
const framed = () => {
  const W = 40;
  const d = new Uint8ClampedArray(W * W * 4).fill(255);
  for (let y = 10; y < 30; y++)
    for (let x = 10; x < 30; x++)
      if (x < 12 || x > 27 || y < 12 || y > 27) {
        const p = (y * W + x) * 4;
        d[p] = d[p + 1] = d[p + 2] = 0;
      }
  return { d, W };
};

describe("warna", () => {
  it("hex, rgb, dan hsv saling bolak-balik", () => {
    expect(rgbToHex(hexToRgb("#1e88e5"))).toBe("#1e88e5");
    expect(hsvToHex(0, 1, 1)).toBe("#ff0000");
    expect(hsvToHex(120, 1, 1)).toBe("#00ff00");
    expect(hsvToHex(240, 1, 1)).toBe("#0000ff");
    const [h, s, v] = hexToHsv("#1e88e5");
    expect(hsvToHex(h, s, v)).toBe("#1e88e5");
  });
});

describe("ember cat", () => {
  it("hanya mengisi ruang di dalam garis", () => {
    const { d, W } = framed();
    const inside = floodMask(d, W, W, 20, 20);
    expect(inside.mask.reduce((a, b) => a + b, 0)).toBe(16 * 16);
    expect(inside.mask[5 * W + 5]).toBe(0);
  });
  it("mengisi ruang di luar garis tanpa bocor ke dalam", () => {
    const { d, W } = framed();
    const outside = floodMask(d, W, W, 2, 2);
    expect(outside.mask.reduce((a, b) => a + b, 0)).toBe(W * W - 20 * 20);
  });
  it("pelebaran menutup tepi garis tanpa keluar bingkai", () => {
    const { d, W } = framed();
    const r = floodMask(d, W, W, 20, 20);
    const wide = dilate(r.mask, W, W, 2, r.box);
    expect(wide.mask[11 * W + 11]).toBe(1);
    expect(wide.mask[9 * W + 9]).toBe(0);
  });
});

describe("gradasi", () => {
  it("lurus: warna 1 di titik awal, warna 2 di titik akhir, luar mask transparan", () => {
    const { d, W } = framed();
    const r = floodMask(d, W, W, 20, 20);
    const out = new Uint8ClampedArray(W * W * 4);
    gradientPixels(out, W, r.mask, r.box, { x: 12, y: 20 }, { x: 28, y: 20 }, [255, 0, 0], [0, 0, 255], "linear");
    const at = (x: number, y: number) => out.slice((y * W + x) * 4, (y * W + x) * 4 + 4);
    expect(Array.from(at(12, 20))).toEqual([255, 0, 0, 255]);
    expect(at(27, 20)[2]).toBeGreaterThan(230);
    expect(at(5, 5)[3]).toBe(0);
  });
  it("melingkar: pusat warna 1, tepi warna 2", () => {
    const { d, W } = framed();
    const r = floodMask(d, W, W, 20, 20);
    const out = new Uint8ClampedArray(W * W * 4);
    gradientPixels(out, W, r.mask, r.box, { x: 20, y: 20 }, { x: 28, y: 20 }, [255, 0, 0], [0, 0, 255], "radial");
    expect(out[(20 * W + 20) * 4]).toBe(255);
    expect(out[(20 * W + 27) * 4 + 2]).toBeGreaterThan(200);
  });
});
