/* MWR service worker — démarrage plein écran + repli hors-ligne */
const CACHE='mwr-v1';
const ASSETS=['./','./manifest.json'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
/* Stratégie : réseau d'abord (données fraîches), repli cache si hors-ligne.
   Jamais de cache pour les tuiles/radar/API (gérées par l'app elle-même). */
self.addEventListener('fetch', e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET') return;
  if(url.origin!==location.origin) return;          // tuiles, API radar : direct réseau
  e.respondWith(
    fetch(e.request).then(r=>{
      const cp=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});
      return r;
    }).catch(()=>caches.match(e.request).then(m=>m||caches.match('./')))
  );
});
