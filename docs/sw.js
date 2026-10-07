// Généré par tools/build.py : ne pas modifier à la main.
var CACHE = "kvb-4a76036988", FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "fonts/baloo-2-latin-500-normal.woff2", "fonts/baloo-2-latin-600-normal.woff2", "fonts/baloo-2-latin-700-normal.woff2", "fonts/baloo-2-latin-800-normal.woff2", "fonts/nunito-latin-400-normal.woff2", "fonts/nunito-latin-600-normal.woff2", "fonts/nunito-latin-700-normal.woff2", "fonts/nunito-latin-800-normal.woff2", "fonts/rubik-latin-400-normal.woff2", "fonts/rubik-latin-600-normal.woff2", "fonts/rubik-latin-700-normal.woff2", "fonts/rubik-latin-800-normal.woff2", "fonts/bungee-latin-400-normal.woff2"];
self.addEventListener("install", function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener("activate", function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch:true }).then(function(r){ return r || fetch(e.request); }));
});
