import { useEffect, useRef, useState } from "react";
import { clamp, hexToHsv, hsvToHex } from "@/lib/paint-utils";

const HUE_RING = "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)";
const RING_INNER = 0.68; // batas dalam cincin, sebagai pecahan jari-jari
const BOX = 0.46; // sisi kotak warna, sebagai pecahan diameter

/**
 * Roda warna bulat: cincin untuk memilih warna dasar (hue), kotak di tengah untuk terang-gelap
 * dan pucat-pekat. Digeser dengan jari, tidak perlu mengetik apa pun.
 */
export function ColorWheel({ value, onChange, onCommit }: { value: string; onChange: (hex: string) => void; onCommit?: (hex: string) => void }) {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(value));
  const mode = useRef<"hue" | "sv" | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(value);

  useEffect(() => {
    if (value.toLowerCase() !== hsvToHex(...hsv).toLowerCase()) setHsv(hexToHsv(value));
    latest.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (e: React.PointerEvent, start: boolean) => {
    const r = box.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (start) {
      const half = (r.width * BOX) / 2;
      if (Math.abs(dx) <= half && Math.abs(dy) <= half) mode.current = "sv";
      else if (Math.hypot(dx, dy) >= (r.width / 2) * RING_INNER * 0.88 && Math.hypot(dx, dy) <= (r.width / 2) * 1.06) mode.current = "hue";
      else return false;
    }
    let [h, s, v] = hsv;
    if (mode.current === "hue") {
      h = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      if (s < 0.05) s = 0.8;
      if (v < 0.05) v = 0.9;
    } else {
      const side = r.width * BOX;
      s = clamp((dx + side / 2) / side, 0, 1);
      v = clamp(1 - (dy + side / 2) / side, 0, 1);
    }
    setHsv([h, s, v]);
    const hex = hsvToHex(h, s, v);
    latest.current = hex;
    onChange(hex);
    return true;
  };

  const [h, s, v] = hsv;
  const a = (h * Math.PI) / 180;
  const mid = ((RING_INNER + 1) / 2) * 50;
  return (
    <div
      ref={box}
      role="group"
      aria-label="Roda warna"
      className="relative mx-auto aspect-square w-full max-w-[240px] touch-none select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        if (update(e, true)) e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => mode.current && update(e, false)}
      onPointerUp={() => {
        if (mode.current) onCommit?.(latest.current);
        mode.current = null;
      }}
      onPointerCancel={() => (mode.current = null)}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: HUE_RING,
          WebkitMask: `radial-gradient(farthest-side, transparent ${RING_INNER * 100 - 0.5}%, #000 ${RING_INNER * 100}%)`,
          mask: `radial-gradient(farthest-side, transparent ${RING_INNER * 100 - 0.5}%, #000 ${RING_INNER * 100}%)`,
        }}
      />
      <div
        className="absolute rounded-2xl shadow-inner"
        style={{
          left: `${50 - (BOX * 100) / 2}%`,
          top: `${50 - (BOX * 100) / 2}%`,
          width: `${BOX * 100}%`,
          height: `${BOX * 100}%`,
          background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ${hsvToHex(h, 1, 1)})`,
        }}
      />
      <span
        className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-[0_0_0_2px_rgba(0,0,0,.35)]"
        style={{ left: `${50 + Math.sin(a) * mid}%`, top: `${50 - Math.cos(a) * mid}%`, background: hsvToHex(h, 1, 1) }}
      />
      <span
        className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-[0_0_0_2px_rgba(0,0,0,.35)]"
        style={{ left: `${50 + (s - 0.5) * BOX * 100}%`, top: `${50 + (0.5 - v) * BOX * 100}%`, background: hsvToHex(h, s, v) }}
      />
    </div>
  );
}
