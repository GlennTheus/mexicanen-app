// ===== Service worker: zorgt dat de app ook offline werkt =====
// v2: nieuwe cachenaam + opruimen oude caches + network-first, zodat
// nieuwe deploys altijd doorkomen i.p.v. dat oude cache blijft hangen.

const CACHE_NAAM = "mexicanen-cache-v2";

// bestanden die nodig zijn om de app te draaien
// (let op: icon-bestanden staan in de root, niet in een icons/-map)
const BESTANDEN_OM_TE_CACHEN = [
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon192.png",
  "./icon512.png",
];

// bij installatie: alle bestanden vooraf in de cache zetten en meteen activeren
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAAM).then((cache) => cache.addAll(BESTANDEN_OM_TE_CACHEN))
  );
});

// bij activatie: oude caches van vorige versies opruimen en alle tabs overnemen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(
        namen.filter((naam) => naam !== CACHE_NAAM).map((naam) => caches.delete(naam))
      )
    ).then(() => self.clients.claim())
  );
});

// bij elk verzoek: eerst proberen via het netwerk (verse code), en bij
// succes ook meteen de cache bijwerken; offline val terug op de cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const kopie = response.clone();
        caches.open(CACHE_NAAM).then((cache) => cache.put(event.request, kopie));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
