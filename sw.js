// ===== Service worker: zorgt dat de app ook offline werkt =====

const CACHE_NAAM = "mexicanen-cache-v2";

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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAAM).then((cache) => cache.addAll(BESTANDEN_OM_TE_CACHEN))
  );
});

// bij activatie: oude caches opruimen zodat nieuwe deploys doorkomen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(
        namen.filter((n) => n !== CACHE_NAAM).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// bij elk verzoek: eerst netwerk (network-first), val terug op cache bij offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const kopie = res.clone();
        caches.open(CACHE_NAAM).then((cache) => cache.put(event.request, kopie));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
