// Mesin menggambar berlapis (seperti Ibis Paint versi anak): lapisan, kuas, penghapus, ember cat,
// gradasi, urungkan/ulang, simpan otomatis. Tanpa React; layar (PaintStudio) hanya memanggil fungsi di sini.
import { clamp, dilate, floodMask, gradientPixels, hexToRgb, lerpRgb, rgbToHex, type GradientKind } from "./paint-utils";
import { TEMPLATES } from "./paint-templates";

export const SIZE = 800;
export const MAX_LAYERS = 6;
const MAX_UNDO = 15;

export type Tool = "brush" | "gradbrush" | "eraser" | "fill" | "gradient";

export type Layer = {
  id: number;
  name: string;
  canvas: HTMLCanvasElement;
  visible: boolean;
  opacity: number; // 0..1
};

type Snap = { id: number; data: ImageData };

const DB = "bintang-paint";
const STORE = "project";

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const toBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));

export class PaintEngine {
  readonly stage: HTMLElement;
  layers: Layer[] = [];
  active = 0;
  tool: Tool = "brush";
  size = 18;
  alpha = 1;
  color1 = "#e53935";
  color2 = "#1e88e5";
  gradKind: GradientKind = "linear";
  /** Naik tiap ada perubahan yang perlu digambar ulang di layar. */
  version = 0;
  /** Ada perubahan gambar yang belum tersimpan. */
  dirty = false;

  private preview: HTMLCanvasElement;
  private nextId = 1;
  private undoStack: Snap[] = [];
  private redoStack: Snap[] = [];
  private listeners = new Set<() => void>();
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  // Keadaan goresan yang sedang berjalan
  private pointerId: number | null = null;
  private drawing = false;
  private last = { x: 0, y: 0 };
  private mid = { x: 0, y: 0 };
  private dist = 0;
  private fillState: { mask: Uint8Array; box: { minX: number; minY: number; maxX: number; maxY: number }; start: { x: number; y: number } } | null = null;
  private raf = 0;
  private pending: { x: number; y: number } | null = null;

  constructor(stage: HTMLElement) {
    this.stage = stage;
    Object.assign(stage.style, {
      position: "relative",
      touchAction: "none",
      userSelect: "none",
      webkitUserSelect: "none",
      webkitTouchCallout: "none",
      background: "#ffffff",
      overflow: "hidden",
    } as Partial<CSSStyleDeclaration>);
    this.preview = this.makeCanvas();
    this.preview.style.pointerEvents = "none";
    stage.appendChild(this.preview);
    stage.addEventListener("pointerdown", this.onDown);
    stage.addEventListener("pointermove", this.onMove);
    stage.addEventListener("pointerup", this.onUp);
    stage.addEventListener("pointercancel", this.onUp);
    stage.addEventListener("contextmenu", this.noMenu);
  }

  /* ---------- Pengamat ---------- */
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private emit(changedPixels = false) {
    this.version++;
    this.layout();
    if (changedPixels) {
      this.dirty = true;
      this.scheduleSave();
    }
    this.listeners.forEach((f) => f());
  }
  /** Perubahan alat/warna: layar diperbarui, gambar tidak ikut tersimpan ulang. */
  set(patch: Partial<Pick<PaintEngine, "tool" | "size" | "alpha" | "color1" | "color2" | "gradKind">>) {
    Object.assign(this, patch);
    this.emit();
  }

  /* ---------- Kanvas dan susunan lapisan ---------- */
  private makeCanvas() {
    const c = document.createElement("canvas");
    c.width = SIZE;
    c.height = SIZE;
    Object.assign(c.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
    return c;
  }
  private ctx(c: HTMLCanvasElement) {
    return c.getContext("2d")!;
  }
  private layout() {
    this.layers.forEach((l, i) => {
      l.canvas.style.zIndex = String(i * 2 + 1);
      l.canvas.style.opacity = String(l.opacity);
      l.canvas.style.display = l.visible ? "block" : "none";
    });
    this.preview.style.zIndex = String(this.active * 2 + 2);
  }
  get current(): Layer | undefined {
    return this.layers[this.active];
  }

  private resetLayers(specs: { name: string }[]) {
    this.layers.forEach((l) => l.canvas.remove());
    this.layers = specs.map((s) => this.newLayer(s.name));
    this.layers.forEach((l) => this.stage.insertBefore(l.canvas, this.preview));
    this.active = 0;
    this.undoStack = [];
    this.redoStack = [];
  }
  private newLayer(name: string): Layer {
    return { id: this.nextId++, name, canvas: this.makeCanvas(), visible: true, opacity: 1 };
  }

  /** Mulai gambar kosong. `persist=false` untuk tampilan awal, supaya tidak menimpa gambar tersimpan. */
  newBlank(persist = true) {
    this.resetLayers([{ name: "Lapisan 1" }]);
    this.emit(persist);
  }
  /** Mulai halaman mewarnai: lapisan "Warna" di bawah, "Garis" di atas. Warna diisi pada lapisan bawah. */
  newTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return this.newBlank();
    this.resetLayers([{ name: "Warna" }, { name: "Garis" }]);
    const ctx = this.ctx(this.layers[1].canvas);
    ctx.save();
    t.draw(ctx, SIZE);
    ctx.restore();
    this.active = 0;
    this.tool = "fill";
    this.emit(true);
  }

  addLayer() {
    if (this.layers.length >= MAX_LAYERS) return false;
    const l = this.newLayer(`Lapisan ${this.nextId}`);
    this.layers.splice(this.active + 1, 0, l);
    this.stage.insertBefore(l.canvas, this.preview);
    this.active += 1;
    this.clearHistory();
    this.emit(true);
    return true;
  }
  deleteLayer(i = this.active) {
    if (this.layers.length <= 1) return this.clearLayer(i);
    this.layers[i].canvas.remove();
    this.layers.splice(i, 1);
    this.active = clamp(this.active > i ? this.active - 1 : this.active, 0, this.layers.length - 1);
    this.clearHistory();
    this.emit(true);
  }
  clearLayer(i = this.active) {
    this.pushUndo(i);
    this.ctx(this.layers[i].canvas).clearRect(0, 0, SIZE, SIZE);
    this.emit(true);
  }
  moveLayer(i: number, dir: 1 | -1) {
    const j = i + dir;
    if (j < 0 || j >= this.layers.length) return;
    [this.layers[i], this.layers[j]] = [this.layers[j], this.layers[i]];
    if (this.active === i) this.active = j;
    else if (this.active === j) this.active = i;
    this.emit(true);
  }
  select(i: number) {
    this.active = clamp(i, 0, this.layers.length - 1);
    this.emit();
  }
  setVisible(i: number, v: boolean) {
    this.layers[i].visible = v;
    this.emit(true);
  }
  setOpacity(i: number, v: number) {
    this.layers[i].opacity = clamp(v, 0, 1);
    this.emit(true);
  }

  /* ---------- Urungkan / ulang ---------- */
  private clearHistory() {
    this.undoStack = [];
    this.redoStack = [];
  }
  private snap(i: number): Snap {
    const l = this.layers[i];
    return { id: l.id, data: this.ctx(l.canvas).getImageData(0, 0, SIZE, SIZE) };
  }
  private pushUndo(i = this.active) {
    this.undoStack.push(this.snap(i));
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
    this.redoStack = [];
  }
  get canUndo() {
    return this.undoStack.some((s) => this.layers.some((l) => l.id === s.id));
  }
  get canRedo() {
    return this.redoStack.some((s) => this.layers.some((l) => l.id === s.id));
  }
  private travel(from: Snap[], to: Snap[]) {
    while (from.length) {
      const s = from.pop()!;
      const i = this.layers.findIndex((l) => l.id === s.id);
      if (i < 0) continue;
      to.push(this.snap(i));
      this.ctx(this.layers[i].canvas).putImageData(s.data, 0, 0);
      this.active = i;
      this.emit(true);
      return;
    }
  }
  undo() {
    this.travel(this.undoStack, this.redoStack);
  }
  redo() {
    this.travel(this.redoStack, this.undoStack);
  }

  /* ---------- Sentuhan ---------- */
  private noMenu = (e: Event) => e.preventDefault();
  private pos(e: PointerEvent) {
    const r = this.stage.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  }
  private strokeColor() {
    if (this.tool !== "gradbrush") return this.color1;
    // Warna bergeser dari warna 1 ke warna 2 lalu kembali, mengikuti panjang goresan.
    const t = 0.5 - 0.5 * Math.cos((this.dist / 420) * Math.PI * 2);
    return rgbToHex(lerpRgb(hexToRgb(this.color1), hexToRgb(this.color2), t));
  }

  private onDown = (e: PointerEvent) => {
    if (this.pointerId !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    const layer = this.current;
    if (!layer) return;
    e.preventDefault();
    this.pointerId = e.pointerId;
    try {
      this.stage.setPointerCapture(e.pointerId);
    } catch {
      /* abaikan */
    }
    if (!layer.visible) layer.visible = true;
    const p = this.pos(e);
    if (this.tool === "fill") {
      this.fillAt(p.x, p.y);
      this.pointerId = null;
      return;
    }
    if (this.tool === "gradient") {
      this.beginGradient(p);
      return;
    }
    this.beginStroke(p);
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    const events = (e as PointerEvent & { getCoalescedEvents?: () => PointerEvent[] }).getCoalescedEvents?.() ?? [];
    if (this.fillState) return this.moveGradient(this.pos(e));
    if (!this.drawing) return;
    for (const ev of events.length ? events : [e]) this.moveStroke(this.pos(ev));
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    try {
      this.stage.releasePointerCapture(e.pointerId);
    } catch {
      /* abaikan */
    }
    if (this.fillState) return this.endGradient(this.pos(e));
    if (this.drawing) this.endStroke();
  };

  /* ---------- Kuas dan penghapus ---------- */
  private strokeTarget() {
    return this.tool === "eraser" ? this.ctx(this.current!.canvas) : this.ctx(this.preview);
  }
  private beginStroke(p: { x: number; y: number }) {
    this.pushUndo();
    this.drawing = true;
    this.dist = 0;
    this.last = p;
    this.mid = p;
    const pc = this.ctx(this.preview);
    pc.clearRect(0, 0, SIZE, SIZE);
    this.preview.style.opacity = this.tool === "eraser" ? "1" : String(this.alpha);
    const ctx = this.strokeTarget();
    ctx.save();
    ctx.globalCompositeOperation = this.tool === "eraser" ? "destination-out" : "source-over";
    ctx.fillStyle = this.strokeColor();
    ctx.beginPath();
    ctx.arc(p.x, p.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  private moveStroke(p: { x: number; y: number }) {
    const m = { x: (this.last.x + p.x) / 2, y: (this.last.y + p.y) / 2 };
    const ctx = this.strokeTarget();
    ctx.save();
    ctx.globalCompositeOperation = this.tool === "eraser" ? "destination-out" : "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = this.size;
    ctx.strokeStyle = this.strokeColor();
    ctx.beginPath();
    ctx.moveTo(this.mid.x, this.mid.y);
    ctx.quadraticCurveTo(this.last.x, this.last.y, m.x, m.y);
    ctx.stroke();
    ctx.restore();
    this.dist += Math.hypot(p.x - this.last.x, p.y - this.last.y);
    this.last = p;
    this.mid = m;
  }
  private endStroke() {
    this.drawing = false;
    if (this.tool !== "eraser") {
      const ctx = this.ctx(this.current!.canvas);
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.drawImage(this.preview, 0, 0);
      ctx.restore();
    }
    this.ctx(this.preview).clearRect(0, 0, SIZE, SIZE);
    this.preview.style.opacity = "1";
    this.emit(true);
  }

  /* ---------- Ember cat dan gradasi ---------- */
  /** Gambar semua lapisan yang terlihat di atas kertas putih. */
  private flatten(forExport = false): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = SIZE;
    c.height = SIZE;
    const ctx = c.getContext("2d", { willReadFrequently: !forExport })!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (const l of this.layers) {
      if (!l.visible) continue;
      ctx.globalAlpha = l.opacity;
      ctx.drawImage(l.canvas, 0, 0);
    }
    return c;
  }
  /** Wilayah tertutup yang tersambung dengan titik, dilihat dari semua lapisan yang terlihat. */
  private regionAt(x: number, y: number) {
    const flat = this.flatten();
    const data = flat.getContext("2d")!.getImageData(0, 0, SIZE, SIZE).data;
    const r = floodMask(data, SIZE, SIZE, x, y, 48);
    return dilate(r.mask, SIZE, SIZE, 2, r.box);
  }
  private paintPixels(img: ImageData, into: HTMLCanvasElement) {
    const tmp = document.createElement("canvas");
    tmp.width = SIZE;
    tmp.height = SIZE;
    tmp.getContext("2d")!.putImageData(img, 0, 0);
    this.ctx(into).drawImage(tmp, 0, 0);
  }
  private solid(mask: Uint8Array, box: { minX: number; minY: number; maxX: number; maxY: number }, color: string) {
    const img = new ImageData(SIZE, SIZE);
    const [r, g, b] = hexToRgb(color);
    for (let y = box.minY; y <= box.maxY; y++)
      for (let x = box.minX; x <= box.maxX; x++) {
        const i = y * SIZE + x;
        if (!mask[i]) continue;
        const p = i * 4;
        img.data[p] = r;
        img.data[p + 1] = g;
        img.data[p + 2] = b;
        img.data[p + 3] = 255;
      }
    return img;
  }
  fillAt(x: number, y: number) {
    const { mask, box } = this.regionAt(x, y);
    this.pushUndo();
    this.paintPixels(this.solid(mask, box, this.color1), this.current!.canvas);
    this.emit(true);
  }
  private beginGradient(p: { x: number; y: number }) {
    const { mask, box } = this.regionAt(p.x, p.y);
    this.fillState = { mask, box, start: p };
    this.preview.style.opacity = "1";
    this.renderGradient(p);
  }
  private moveGradient(p: { x: number; y: number }) {
    this.pending = p;
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      if (this.fillState && this.pending) this.renderGradient(this.pending);
    });
  }
  private renderGradient(p: { x: number; y: number }) {
    const f = this.fillState!;
    const far = Math.hypot(p.x - f.start.x, p.y - f.start.y);
    const img = far < 8 ? this.solid(f.mask, f.box, this.color1) : new ImageData(SIZE, SIZE);
    if (far >= 8) gradientPixels(img.data, SIZE, f.mask, f.box, f.start, p, hexToRgb(this.color1), hexToRgb(this.color2), this.gradKind);
    const pc = this.ctx(this.preview);
    pc.clearRect(0, 0, SIZE, SIZE);
    this.paintPixels(img, this.preview);
    if (far >= 8) {
      // Garis penunjuk arah gradasi
      pc.save();
      pc.strokeStyle = "rgba(0,0,0,.55)";
      pc.lineWidth = 3;
      pc.setLineDash([10, 8]);
      pc.beginPath();
      pc.moveTo(f.start.x, f.start.y);
      pc.lineTo(p.x, p.y);
      pc.stroke();
      pc.setLineDash([]);
      pc.fillStyle = this.color1;
      pc.strokeStyle = "#fff";
      pc.lineWidth = 4;
      pc.beginPath();
      pc.arc(f.start.x, f.start.y, 12, 0, Math.PI * 2);
      pc.fill();
      pc.stroke();
      pc.fillStyle = this.color2;
      pc.beginPath();
      pc.arc(p.x, p.y, 12, 0, Math.PI * 2);
      pc.fill();
      pc.stroke();
      pc.restore();
    }
  }
  private endGradient(p: { x: number; y: number }) {
    const f = this.fillState!;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.pending = null;
    const far = Math.hypot(p.x - f.start.x, p.y - f.start.y);
    this.pushUndo();
    const img = far < 8 ? this.solid(f.mask, f.box, this.color1) : new ImageData(SIZE, SIZE);
    if (far >= 8) gradientPixels(img.data, SIZE, f.mask, f.box, f.start, p, hexToRgb(this.color1), hexToRgb(this.color2), this.gradKind);
    this.paintPixels(img, this.current!.canvas);
    this.ctx(this.preview).clearRect(0, 0, SIZE, SIZE);
    this.fillState = null;
    this.emit(true);
  }

  /* ---------- Simpan ---------- */
  /** Gambar akhir (semua lapisan digabung di atas kertas putih) sebagai PNG. */
  exportPng() {
    return toBlob(this.flatten(true));
  }
  isEmpty() {
    return this.layers.every((l) => {
      const d = this.ctx(l.canvas).getImageData(0, 0, SIZE, SIZE).data;
      for (let i = 3; i < d.length; i += 4) if (d[i]) return false;
      return true;
    });
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.save(), 1500);
  }
  async save() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    if (!this.dirty || typeof indexedDB === "undefined") return;
    try {
      const layers = await Promise.all(
        this.layers.map(async (l) => ({ name: l.name, visible: l.visible, opacity: l.opacity, blob: await toBlob(l.canvas) })),
      );
      const db = await idb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put({ layers, active: this.active, savedAt: Date.now() }, "current");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      this.dirty = false;
    } catch {
      /* penyimpanan tidak tersedia: gambar tetap bisa dipakai */
    }
  }
  /** Muat gambar terakhir. Mengembalikan false kalau belum ada. */
  async load() {
    if (typeof indexedDB === "undefined") return false;
    try {
      const db = await idb();
      const saved = await new Promise<
        { layers: { name: string; visible: boolean; opacity: number; blob: Blob }[]; active: number } | undefined
      >((resolve, reject) => {
        const r = db.transaction(STORE).objectStore(STORE).get("current");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      if (!saved?.layers?.length || this.destroyed) return false;
      this.resetLayers(saved.layers.map((l) => ({ name: l.name })));
      await Promise.all(
        saved.layers.map(async (s, i) => {
          const bmp = await createImageBitmap(s.blob);
          this.ctx(this.layers[i].canvas).drawImage(bmp, 0, 0);
          this.layers[i].visible = s.visible;
          this.layers[i].opacity = s.opacity;
        }),
      );
      this.active = clamp(saved.active ?? 0, 0, this.layers.length - 1);
      this.dirty = false;
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  destroy() {
    this.destroyed = true;
    void this.save();
    this.stage.removeEventListener("pointerdown", this.onDown);
    this.stage.removeEventListener("pointermove", this.onMove);
    this.stage.removeEventListener("pointerup", this.onUp);
    this.stage.removeEventListener("pointercancel", this.onUp);
    this.stage.removeEventListener("contextmenu", this.noMenu);
    cancelAnimationFrame(this.raf);
    this.listeners.clear();
    // Kanvas dicopot dari layar (data tetap di memori sampai penyimpanan terakhir selesai).
    this.layers.forEach((l) => l.canvas.remove());
    this.preview.remove();
  }
}
