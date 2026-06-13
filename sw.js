// ===== Service worker: zorgt dat de app ook offline werkt =====

const CACHE_NAAM = "mexicanen-cache-v1";

// bestanden die nodig zijn om de app te draaien
const BESTANDEN_OM_TE_CACHEN = [
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// bij installatie: alle bestanden vooraf in de cache zetten
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAAM).then((cache) => cache.addAll(BESTANDEN_OM_TE_CACHEN))
  );
});

// bij elk verzoek: eerst kijken of het al in de cache staat (offline-first)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cacheResultaat) => {
      return cacheResultaat || fetch(event.request);
    })
  );
});
