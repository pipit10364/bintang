/* Service worker Belajar Ceria: membuat aplikasi bisa dibuka tanpa internet.
 *
 * - Halaman (HTML): coba internet dulu (maks. 3 detik), kalau gagal pakai salinan tersimpan.
 * - File aplikasi (JS, CSS, gambar; namanya berhash): pakai salinan tersimpan lebih dulu.
 * - Huruf Google Fonts: disimpan setelah pertama kali dimuat.
 * - Pesan {type:"warm", urls:[...]} dari aplikasi: unduh semua halaman dan file yang
 *   dibutuhkan sekaligus, supaya semua pelajaran sudah siap walau belum pernah dibuka.
 * Naikkan VERSION kalau logika service worker ini berubah.
 */
const VERSION = "v1";
const CACHE = `bintang-${VERSION}`;
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const MAX_FILES = 600;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith("bintang-") && k !== CACHE) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

const pageKey = (url) => new Request(url.origin + url.pathname);
const isAsset = (p) => /^\/assets\//.test(p) || /\.(?:js|css|woff2?|png|jpe?g|svg|webp|webmanifest|ico)$/.test(p);

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

async function pageFirstNetwork(req) {
  const url = new URL(req.url);
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(req), 3000);
    const type = res.headers.get("content-type") || "";
    if (res.ok && type.includes("text/html")) cache.put(pageKey(url), res.clone());
    return res;
  } catch {
    const hit = (await cache.match(pageKey(url))) || (await cache.match(new Request(url.origin + "/")));
    if (hit) return hit;
    return new Response(
      "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><body style='font-family:sans-serif;text-align:center;padding:3rem'><h1>Belum tersimpan</h1><p>Halaman ini belum pernah dibuka saat ada internet. Sambungkan internet sekali, lalu buka lagi.</p>",
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const net = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit || (await net) || Response.error();
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
    if (req.mode === "navigate") return e.respondWith(pageFirstNetwork(req));
    if (/^\/assets\//.test(url.pathname)) return e.respondWith(cacheFirst(req));
    if (isAsset(url.pathname)) return e.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) e.respondWith(cacheFirst(req));
});

/* ---------- Unduh semuanya sekaligus ---------- */
const URL_IN_CSS = /url\(\s*["']?([^"')]+)["']?\s*\)/g;
const ATTR_URL = /(?:src|href)=["']([^"']+)["']/g;
const JS_SPEC = /["'](\.{1,2}\/[^"'\s]+?\.(?:js|css))["']/g;
const JS_ROOT = /["'](\/?assets\/[^"'\s]+?\.(?:js|css|woff2?|png|svg|webp))["']/g;

async function warm(urls) {
  const cache = await caches.open(CACHE);
  const origin = self.location.origin;
  const queue = [];
  const seen = new Set();
  let files = 0;
  let pages = 0;

  const enqueue = (raw, base) => {
    let u;
    try {
      u = new URL(raw, base);
    } catch {
      return;
    }
    if (u.origin !== origin && !FONT_HOSTS.includes(u.hostname)) return;
    u.hash = "";
    const s = u.toString();
    if (seen.has(s) || seen.size > MAX_FILES) return;
    seen.add(s);
    queue.push(s);
  };

  // Halaman: selalu ambil yang terbaru, lalu cari file yang dipakainya.
  for (let i = 0; i < urls.length; i += 4) {
    await Promise.all(
      urls.slice(i, i + 4).map(async (path) => {
        try {
          const u = new URL(path, origin);
          const res = await fetch(u.toString(), { cache: "reload" });
          if (!res.ok || !(res.headers.get("content-type") || "").includes("text/html")) return;
          await cache.put(pageKey(u), res.clone());
          pages++;
          const html = await res.text();
          for (const m of html.matchAll(ATTR_URL)) {
            if (/\.(?:js|css|png|ico|webmanifest)(\?|$)/.test(m[1]) || /fonts\.googleapis\.com/.test(m[1])) enqueue(m[1], u);
          }
        } catch {
          /* lanjut ke halaman berikutnya */
        }
      }),
    );
  }

  // File: JS dan CSS dibaca juga untuk menemukan potongan (chunk) dan huruf yang dipanggilnya.
  while (queue.length) {
    const batch = queue.splice(0, 6);
    await Promise.all(
      batch.map(async (s) => {
        try {
          let res = await cache.match(s);
          if (!res) {
            res = await fetch(s, { mode: s.startsWith(origin) ? "same-origin" : "cors" });
            if (!res.ok) return;
            await cache.put(s, res.clone());
          }
          files++;
          const path = new URL(s).pathname;
          if (/\.js$/.test(path)) {
            const text = await res.clone().text();
            for (const m of text.matchAll(JS_SPEC)) enqueue(m[1], s);
            for (const m of text.matchAll(JS_ROOT)) enqueue(m[1].startsWith("/") ? m[1] : "/" + m[1], origin);
          } else if (/\.css$/.test(path) || /fonts\.googleapis\.com/.test(s)) {
            const text = await res.clone().text();
            for (const m of text.matchAll(URL_IN_CSS)) if (!m[1].startsWith("data:")) enqueue(m[1], s);
          }
        } catch {
          /* satu file gagal tidak menghentikan yang lain */
        }
      }),
    );
  }
  return { pages, files };
}

self.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || d.type !== "warm" || !Array.isArray(d.urls)) return;
  const port = e.source;
  e.waitUntil(
    warm(d.urls).then(
      (r) => port && port.postMessage({ type: "warmed", ...r }),
      () => port && port.postMessage({ type: "warm-failed" }),
    ),
  );
});
