const CACHE_NAME = "afei-stoneage-v270-direct-20260928";
const PRECACHE = ["./index.html","./game.html","./styles.css","./game.css","./app.js","./game.js","./manifest.json","./pwa.js","./data/generated/capture_items.json","./data/generated/stoneage_attack_magic_runtime.json","./data/generated/stoneage_enemy_ai.json","./data/generated/stoneage_enemy_weapon_runtime.json","./data/generated/stoneage_general_encounter_runtime.json","./data/generated/stoneage_general_lv1_pets.json","./data/generated/stoneage_general_lv1_routes.csv","./data/generated/stoneage_gmque_trophy_runtime.json","./data/generated/stoneage_item_field2_runtime.json","./data/generated/stoneage_item_magic_runtime.json","./data/generated/stoneage_item_make_runtime.json","./data/generated/stoneage_item_relife_runtime.json","./data/generated/stoneage_pet_merge_fix_runtime.json","./data/generated/stoneage_pet_modai.json","./data/generated/stoneage_petskill_runtime.json","./data/generated/stoneage_profession_skill_runtime.json","./data/generated/validation.json","./data/generated/zoo_quest.json","./data/stoneage_floor_names_85.json","./icons/icon-192.png","./icons/icon-512.png"];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('afei-stoneage-v270-') && k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if(cached) return cached;
    try {
      const response = await fetch(req);
      if(response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
      }
      return response;
    } catch(err) {
      if(req.mode === 'navigate') return caches.match('./game.html');
      throw err;
    }
  })());
});

self.addEventListener('message', event => {
  if(event.data === 'SKIP_WAITING') self.skipWaiting();
});
