// Gambar garis untuk diwarnai. Digambar dengan kode (bukan file gambar), jadi ringan dan ikut tersimpan offline.
// Semua bentuk dibuat tertutup supaya ember cat (isi warna) tidak "bocor".

export type Template = {
  id: string;
  name: string;
  emoji: string;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
};

const INK = "#3b2f2f";

function setup(ctx: CanvasRenderingContext2D, size: number) {
  ctx.scale(size / 800, size / 800);
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
};

/** Batasi gambar berikutnya supaya hanya muncul di luar sebuah lingkaran. */
const clipOutsideCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.rect(0, 0, 800, 800);
  ctx.arc(x, y, r, 0, Math.PI * 2, true);
  ctx.clip("evenodd");
};

function rumah(ctx: CanvasRenderingContext2D, size: number) {
  setup(ctx, size);
  ctx.stroke(new Path2D("M200 380 H600 V680 H200 Z"));
  ctx.stroke(new Path2D("M160 390 L400 190 L640 390 Z"));
  ctx.stroke(new Path2D("M350 680 V520 H450 V680"));
  ctx.stroke(new Path2D("M240 450 H330 V540 H240 Z"));
  ctx.stroke(new Path2D("M470 450 H560 V540 H470 Z"));
  ctx.stroke(new Path2D("M500 288 V210 H560 V330"));
  circle(ctx, 680, 130, 60);
  ctx.stroke(new Path2D("M60 680 H740"));
}

function bunga(ctx: CanvasRenderingContext2D, size: number) {
  setup(ctx, size);
  const cx = 400;
  const cy = 280;
  circle(ctx, cx, cy, 62);
  ctx.save();
  clipOutsideCircle(ctx, cx, cy, 62);
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.ellipse(cx + Math.sin(a) * 155, cy - Math.cos(a) * 155, 50, 92, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.stroke(new Path2D("M395 540 C395 620 380 700 400 780"));
  ctx.stroke(new Path2D("M405 540 C405 620 420 700 400 780"));
  ctx.stroke(new Path2D("M398 660 C320 620 290 660 300 700 C350 710 385 690 398 660 Z"));
  ctx.stroke(new Path2D("M402 700 C480 660 510 700 500 740 C450 750 415 730 402 700 Z"));
}

function ikan(ctx: CanvasRenderingContext2D, size: number) {
  setup(ctx, size);
  ctx.beginPath();
  ctx.ellipse(360, 400, 200, 120, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.stroke(new Path2D("M553 366 L690 290 L690 510 L553 434"));
  ctx.stroke(new Path2D("M300 286 Q350 190 420 282"));
  ctx.stroke(new Path2D("M300 330 Q270 400 300 470"));
  circle(ctx, 235, 370, 22);
  ctx.stroke(new Path2D("M170 440 Q210 470 250 440"));
  circle(ctx, 130, 280, 26);
  circle(ctx, 90, 210, 18);
  circle(ctx, 140, 150, 12);
}

function bintang(ctx: CanvasRenderingContext2D, size: number) {
  setup(ctx, size);
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? 320 : 130;
    const a = (k * Math.PI) / 5 - Math.PI / 2;
    const x = 400 + Math.cos(a) * r;
    const y = 430 + Math.sin(a) * r;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function kucing(ctx: CanvasRenderingContext2D, size: number) {
  setup(ctx, size);
  circle(ctx, 400, 430, 220);
  ctx.save();
  clipOutsideCircle(ctx, 400, 430, 220);
  ctx.stroke(new Path2D("M205 330 L220 140 L370 230"));
  ctx.stroke(new Path2D("M595 330 L580 140 L430 230"));
  ctx.restore();
  for (const x of [320, 480]) {
    ctx.beginPath();
    ctx.ellipse(x, 400, 30, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.stroke(new Path2D("M382 470 H418 L400 495 Z"));
  ctx.stroke(new Path2D("M400 495 Q385 535 345 525"));
  ctx.stroke(new Path2D("M400 495 Q415 535 455 525"));
  for (const [a, b] of [
    [[170, 450], [285, 465]],
    [[170, 505], [285, 492]],
    [[630, 450], [515, 465]],
    [[630, 505], [515, 492]],
  ]) {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
}

function mobil(ctx: CanvasRenderingContext2D, size: number) {
  setup(ctx, size);
  const wheels: [number, number][] = [
    [230, 530],
    [590, 530],
  ];
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 800, 800);
  for (const [x, y] of wheels) ctx.arc(x, y, 72, 0, Math.PI * 2, true);
  ctx.clip("evenodd");
  ctx.stroke(
    new Path2D(
      "M100 520 V450 Q100 415 135 410 L260 395 L335 305 Q350 285 375 285 H555 Q580 285 595 305 L665 395 L690 400 Q720 405 720 435 V520 Z",
    ),
  );
  ctx.restore();
  for (const [x, y] of wheels) {
    circle(ctx, x, y, 72);
    circle(ctx, x, y, 28);
  }
  ctx.stroke(new Path2D("M305 395 L355 315 H430 V395 Z"));
  ctx.stroke(new Path2D("M470 395 V315 H550 L600 395 Z"));
  ctx.stroke(new Path2D("M60 625 H740"));
}

export const TEMPLATES: Template[] = [
  { id: "rumah", name: "Rumah", emoji: "🏠", draw: rumah },
  { id: "bunga", name: "Bunga", emoji: "🌸", draw: bunga },
  { id: "ikan", name: "Ikan", emoji: "🐟", draw: ikan },
  { id: "bintang", name: "Bintang", emoji: "⭐", draw: bintang },
  { id: "kucing", name: "Kucing", emoji: "🐱", draw: kucing },
  { id: "mobil", name: "Mobil", emoji: "🚗", draw: mobil },
];
