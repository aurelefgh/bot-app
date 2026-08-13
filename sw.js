/*
 * Le service worker : ce qui fait de la page une VRAIE application.
 *
 * Strategie "reseau d'abord, cache en secours" PARTOUT :
 *  - en ligne : on a toujours la derniere version de l'appli ET des donnees
 *    (et on met le cache a jour au passage) ;
 *  - hors ligne : l'appli s'ouvre quand meme, sur la derniere version et
 *    les dernieres donnees connues.
 * (La strategie inverse — cache d'abord — rend les mises a jour invisibles :
 *  teste, subi, corrige.)
 */
const CACHE = "bot-trading-v2";
const COQUILLE = ["./", "index.html", "manifest.json",
                  "icone-192.png", "icone-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const nom of await caches.keys()) {
      if (nom !== CACHE) await caches.delete(nom);   // vide les vieux caches
    }
    await clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then((rep) => {
      if (rep.ok) {
        const copie = rep.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copie));
      }
      return rep;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
