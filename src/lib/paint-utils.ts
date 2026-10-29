// Fungsi murni untuk menggambar dan mewarnai (tanpa DOM, jadi mudah dites).

export type RGB = [number, number, number];

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.padEnd(6, "0").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const x = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0");
  return `#${x(r)}${x(g)}${x(b)}`;
}

/** h: 0-360, s dan v: 0-1. */
export function hsvToRgb(h: number, s: number, v: number): RGB {
  const hh = (((h % 360) + 360) % 360) / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    hh < 1 ? [c, x, 0] : hh < 2 ? [x, c, 0] : hh < 3 ? [0, c, x] : hh < 4 ? [0, x, c] : hh < 5 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function rgbToHsv([r, g, b]: RGB): [number, number, number] {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const d = max - Math.min(R, G, B);
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

export const hsvToHex = (h: number, s: number, v: number) => rgbToHex(hsvToRgb(h, s, v));
export const hexToHsv = (hex: string) => rgbToHsv(hexToRgb(hex));

export const lerpRgb = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export type Box = { minX: number; minY: number; maxX: number; maxY: number };

/**
 * Cari wilayah yang tersambung dengan titik (x, y): piksel yang warnanya mirip dengan piksel awal.
 * `data` adalah RGBA (Uint8ClampedArray) berukuran w*h. Hasilnya mask 0/1, plus kotak pembatasnya.
 */
export function floodMask(data: Uint8ClampedArray, w: number, h: number, x: number, y: number, tol = 48) {
  const mask = new Uint8Array(w * h);
  x = clamp(Math.floor(x), 0, w - 1);
  y = clamp(Math.floor(y), 0, h - 1);
  const s = (y * w + x) * 4;
  const r0 = data[s];
  const g0 = data[s + 1];
  const b0 = data[s + 2];
  const a0 = data[s + 3];
  const same = (i: number) => {
    const p = i * 4;
    return (
      Math.abs(data[p] - r0) <= tol &&
      Math.abs(data[p + 1] - g0) <= tol &&
      Math.abs(data[p + 2] - b0) <= tol &&
      Math.abs(data[p + 3] - a0) <= tol
    );
  };
  const box: Box = { minX: x, maxX: x, minY: y, maxY: y };
  const stack: number[] = [x, y];
  while (stack.length) {
    const cy = stack.pop()!;
    let cx = stack.pop()!;
    let i = cy * w + cx;
    if (mask[i] || !same(i)) continue;
    // Geser ke kiri sejauh mungkin, lalu isi satu baris ke kanan.
    while (cx > 0 && !mask[i - 1] && same(i - 1)) {
      cx--;
      i--;
    }
    let up = false;
    let down = false;
    while (cx < w && !mask[i] && same(i)) {
      mask[i] = 1;
      if (cx < box.minX) box.minX = cx;
      if (cx > box.maxX) box.maxX = cx;
      if (cy < box.minY) box.minY = cy;
      if (cy > box.maxY) box.maxY = cy;
      if (cy > 0) {
        const u = i - w;
        const ok = !mask[u] && same(u);
        if (ok && !up) stack.push(cx, cy - 1);
        up = ok;
      }
      if (cy < h - 1) {
        const d = i + w;
        const ok = !mask[d] && same(d);
        if (ok && !down) stack.push(cx, cy + 1);
        down = ok;
      }
      cx++;
      i++;
    }
  }
  return { mask, box };
}

/** Lebarkan mask sejauh r piksel (menutup tepi garis yang halus). */
export function dilate(mask: Uint8Array, w: number, h: number, r: number, box: Box) {
  let cur = mask;
  const out = { ...box };
  for (let k = 0; k < r; k++) {
    const next = new Uint8Array(cur);
    const x0 = Math.max(out.minX - 1, 0);
    const x1 = Math.min(out.maxX + 1, w - 1);
    const y0 = Math.max(out.minY - 1, 0);
    const y1 = Math.min(out.maxY + 1, h - 1);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (cur[i]) continue;
        if ((x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]) || (y > 0 && cur[i - w]) || (y < h - 1 && cur[i + w]))
          next[i] = 1;
      }
    }
    out.minX = x0;
    out.maxX = x1;
    out.minY = y0;
    out.maxY = y1;
    cur = next;
  }
  return { mask: cur, box: out };
}

export type GradientKind = "linear" | "radial";

/**
 * Isi piksel di dalam mask dengan gradasi dua warna.
 * Linear: dari titik p0 ke p1. Radial: dari pusat p0, jari-jari sejauh p0 ke p1.
 * Piksel di luar mask dibiarkan transparan.
 */
export function gradientPixels(
  out: Uint8ClampedArray,
  w: number,
  mask: Uint8Array,
  box: Box,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  c1: RGB,
  c2: RGB,
  kind: GradientKind,
) {
  const vx = p1.x - p0.x;
  const vy = p1.y - p0.y;
  const len2 = vx * vx + vy * vy || 1;
  const rad = Math.sqrt(len2);
  for (let y = box.minY; y <= box.maxY; y++) {
    for (let x = box.minX; x <= box.maxX; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      const t = clamp(
        kind === "linear" ? ((x - p0.x) * vx + (y - p0.y) * vy) / len2 : Math.hypot(x - p0.x, y - p0.y) / rad,
        0,
        1,
      );
      const p = i * 4;
      out[p] = c1[0] + (c2[0] - c1[0]) * t;
      out[p + 1] = c1[1] + (c2[1] - c1[1]) * t;
      out[p + 2] = c1[2] + (c2[2] - c1[2]) * t;
      out[p + 3] = 255;
    }
  }
}
