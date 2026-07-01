const CACHE='variaciones-ci-v3';
const ASSETS=['./','index.html','style.css','app.js','charts.js','config.js','manifest.webmanifest','assets/logo.svg','assets/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
