import { PROBLEMS } from "@/lib/data/seed-problems";

// Service worker gerado no build: pré-carrega todas as fichas publicadas/em revisão,
// para a biblioteca abrir sem sinal mesmo em páginas nunca visitadas.
export const dynamic = "force-static";

const LIST = ["/", "/biblioteca", "/biblioteca/soja", "/manifest.webmanifest", "/icon.svg",
  ...PROBLEMS.map((p) => `/biblioteca/soja/${p.slug}`)];
const VERSION = String(PROBLEMS.length) + "-" + PROBLEMS.map((p) => p.slug.length).join("");

const BODY = `// Service worker do Glyma (sem dependências).
// Biblioteca e arquivos estáticos: cache primeiro (funciona sem sinal).
// Demais páginas: rede primeiro, cache como reserva. API: só rede.
const VERSION = "glyma-__V__";
const PRECACHE = __LIST__;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  const cacheFirst = url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/biblioteca");
  if (cacheFirst) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res;
    })));
  } else {
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request).then((hit) => hit || (e.request.mode === "navigate" ? caches.match("/") : Response.error()))));
  }
});

// Notificações (alertas da região e respostas)
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(self.registration.showNotification(d.title || "Glyma", {
    body: d.body || "", icon: "/icon.svg", badge: "/icon.svg", tag: d.tag || "glyma", data: { url: d.url || "/" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((ws) => {
    const w = ws.find((c) => new URL(c.url).origin === location.origin);
    return w ? (w.navigate(url), w.focus()) : self.clients.openWindow(url);
  }));
});
`.replace("__V__", VERSION).replace("__LIST__", JSON.stringify(LIST));

export function GET() {
  return new Response(BODY, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache", "service-worker-allowed": "/" } });
}
